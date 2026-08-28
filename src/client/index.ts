/**
 * dsh-web-notes browser half — mounts the floating note dock + panel directly
 * onto document.body (a global surface, host-global like the pet: notes have
 * no session dimension, and a session-scoped slot would vanish on the
 * new-conversation screen). It talks to the host through the same-origin
 * /api/notes/* JSON endpoints and drives the composer through the official
 * conversation input facade.
 *
 * Insert semantics: with an open session the note text lands in that
 * session's composer draft (appended after any existing draft) — the user
 * reviews and sends it; without an open session the text falls back to the
 * clipboard.
 * @module dsh-web-notes/client
 */

import type { ClientContext, ISessions } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Slot type augmentation: declares `settings.plugin.item` so the settings
// card can be registered under the `notes` namespace key.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import type { NoteView } from './api.ts'
import { createNotesApi } from './api.ts'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { NotesDock } from './NotesDock.tsx'
import { NotesSettingsCard } from './NotesSettingsCard.tsx'
import { notesSettingsSpec, type NotesUiSettings } from './settings.ts'
import { t } from './locales.ts'
import { NOTES_CSS } from './styles.ts'

/** Required services (sessions + conversation power insert-into-composer; the
 * settings scope + slots drive the plugin card in 设置 → 插件 → 插件配置). */
export const inject = ['sessions', 'conversation', 'slots', 'settingsScope']

/**
 * Insert raw text into the current session's composer draft; falls back to
 * the clipboard when no session is open or the input facade is unreachable.
 * @param ctx - client root context.
 * @param text - the text to insert.
 * @returns a toast copy describing what happened.
 */
function insertTextIntoComposer(ctx: ClientContext, text: string): string {
  const list = ctx.sessions.list.getSnapshot()
  const current = list.current
  if (current !== undefined) {
    const actx = ctx.sessions.scope(current)
    if (actx !== undefined) {
      try {
        const input = ctx.conversation.input.for(actx)
        const snapshot = input.state.getSnapshot()
        const draft = snapshot.draft ?? ''
        input.setDraft(draft.trim() === '' ? text : draft + '\n\n' + text)
        return t('notes.selection.inserted')
      } catch {
        // Fall through to the clipboard path.
      }
    }
  }
  // Clipboard fallback (defensive: the Clipboard API may be absent in
  // sandboxed/headless environments — never throw from the insert action).
  const clipboard = navigator.clipboard
  if (clipboard !== undefined) {
    void clipboard.writeText(text).then(() => {
      // Swallow success; the toast below already reports the fallback.
    }, () => {
      // Ignore clipboard failures; the toast reports the fallback regardless.
    })
  }
  return t('notes.item.noSession')
}

/**
 * Insert a note into the current session's composer draft.
 * Only the note CONTENT is inserted — the title is a list label, not chat
 * payload, and would only add noise to the draft.
 * @param ctx - client root context.
 * @param note - the note to insert.
 * @returns a toast copy describing what happened.
 */
function insertIntoComposer(ctx: ClientContext, note: NoteView): string {
  return insertTextIntoComposer(ctx, note.content)
}

/**
 * Client plugin body: inject the styles, read the host switches, and mount
 * the floating notes dock for the page lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // Styles are injected by the module loader's style-tag discipline. The
  // tag's data-plugin MUST equal the loader module id (dsh-web-notes) or the
  // loader cannot claim the styles for unload cleanup.
  const styleTag = document.createElement('style')
  styleTag.dataset.plugin = 'dsh-web-notes'
  styleTag.dataset.pluginCss = 'dsh-web-notes/styles'
  styleTag.textContent = NOTES_CSS
  document.head.appendChild(styleTag)
  let styleRemoved = false
  ctx.effect(() => () => {
    if (styleRemoved) return
    styleRemoved = true
    styleTag.remove()
  }, 'notes: styles')

  const api = createNotesApi()

  // The `notes` settings scope mirrors the Host section; the dock reads its UI
  // preferences live and the settings card writes back through it.
  const settingsScope = ctx.settingsScope.bind<NotesUiSettings>(notesSettingsSpec)

  // Plugin configuration card (设置 → 插件 → 插件配置). Registered only while
  // the settings section exists; the slot owner dispatches it by the `notes`
  // namespace key.
  ctx.effect(() => ctx.slots.inject('settings.plugin.item', function* () {
    yield ctx.slots.register(
      {
        name: 'settings.plugin.item',
        key: 'notes',
        inject: () => ({ scope: settingsScope, notesT: t }),
      },
      NotesSettingsCard,
    )
  }), 'notes: settings card')

  // Host switches gate the whole UI: when disabled the dock never mounts;
  // selectionCapture toggles only the capture bubble.
  let mounted = false
  let root: ReturnType<typeof createRoot> | undefined
  let container: HTMLDivElement | undefined
  const mount = (capture: boolean): void => {
    if (mounted) return
    mounted = true
    container = document.createElement('div')
    container.dataset.dshNotesRoot = ''
    container.dataset.dshPlugin = 'notes'
    document.body.appendChild(container)
    root = createRoot(container)
    root.render(createElement(NotesDock, {
      api,
      t,
      sessions: ctx.sessions as unknown as ISessions,
      settingsScope,
      selectionCapture: capture,
      onInsert: (note) => insertIntoComposer(ctx, note),
      onInsertText: (text) => insertTextIntoComposer(ctx, text),
    }))
  }
  const syncEnabled = (): void => {
    if (mounted) return
    api.state().then((state) => {
      if (mounted) return
      if (!state.enabled) return
      mount(state.selectionCapture)
    }, () => {
      // Transport failure: assume enabled so the UI still tries (the API
      // surface will surface per-call errors).
      if (!mounted) mount(true)
    })
  }
  ctx.effect(() => {
    syncEnabled()
    return () => {
      if (root !== undefined) {
        root.unmount()
        root = undefined
      }
      if (container !== undefined && container.parentNode === document.body) {
        container.remove()
        container = undefined
      }
      mounted = false
    }
  }, 'notes: ui')
}
