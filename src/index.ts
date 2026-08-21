/**
 * dsh-web-notes host half — mounts the notes service, its /api/notes/* routes
 * and the settings namespace. The browser half (the './client' entry) renders
 * the floating note dock + panel and talks to the host through the same-origin
 * JSON endpoints. Notes persist under $DSH_HOME/notes/notes.json.
 *
 * Install via `dsh plugin --profile web add link:<this-dir>`; the
 * cordis.patch.yml inserts this plugin row.
 * @module dsh-web-notes
 */

import { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-host-webserver'
import z from 'schemastery'
import { NotesService, NOTES_SETTINGS_NAMESPACE, type NotesConfig, type NotesSettingsSection } from './service.ts'
import { makeNotesRoutes } from './routes.ts'
import { mountOnce } from './mount-once.ts'

export { NotesService, NOTES_SETTINGS_NAMESPACE } from './service.ts'
export type {
  NoteView,
  NotesConfig,
  NotesResult,
  NotesSettingsSection,
} from './service.ts'
export type { NotesButtonSize, NotesDockMode } from './service.ts'
export {
  NOTES_API_PREFIX,
  makeNotesRoutes,
} from './routes.ts'
export type { Note, NoteSource, NotesPersist } from './persist.ts'
export {
  DEFAULT_NOTE_TITLE,
  NOTE_CONTENT_MAX,
  NOTE_TAGS_MAX,
  NOTE_TITLE_MAX,
  NOTES_MAX,
  loadNotesPersist,
  notesHomeDir,
  saveNotesPersist,
} from './persist.ts'
export { dshHome } from './dsh-home.ts'

/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export const name = 'notes'

/** Services required before the notes plugin can mount its surfaces. */
export const inject = ['webServer']

/**
 * Settings schema: enable switches for the browser half plus the UI
 * preferences (dock placement, button size, default scope). The browser
 * half reads them through its settings scope AND the state endpoint.
 */
export function makeNotesSettingsSchema() {
  return z.object({
    enabled: z.boolean().default(true),
    selectionCapture: z.boolean().default(true),
    dockMode: z.union([z.const('floating'), z.const('fixed')]).default('floating'),
    buttonSize: z.union([z.const('small'), z.const('regular'), z.const('large')]).default('large'),
    defaultGlobal: z.boolean().default(false),
  })
}

/** Register the notes service and its API routes on the context. */
export const apply = mountOnce('dsh-web-notes', applyImpl)

function applyImpl(ctx: Context, config: NotesConfig = {}): void {
  const service = new NotesService(ctx, config)

  // The settings surface edits the switches through the 'notes' namespace.
  // The composition 'base' starts as the config values, so an empty user
  // layer resolves to exactly what the plugin already does.
  const base: NotesSettingsSection = {
    enabled: config.enabled ?? true,
    selectionCapture: config.selectionCapture ?? true,
    dockMode: config.dockMode ?? 'floating',
    buttonSize: config.buttonSize ?? 'large',
    defaultGlobal: config.defaultGlobal ?? false,
  }
  let current: () => NotesSettingsSection = () => base

  // The browser half reads the plugin switches through the same-origin
  // /api/notes/state endpoint; toggling the setting off unmounts the browser
  // UI and makes the notes API disappear until it is re-enabled.
  const routes = makeNotesRoutes(service)
  let disposeRoutes: (() => void) | undefined
  const syncRoutes = (): void => {
    const enabled = current().enabled
    if (disposeRoutes === undefined && enabled) {
      disposeRoutes = ctx.effect(
        () => {
          const disposers = routes.map((route) => ctx.webServer.register(route))
          return () => { for (const dispose of disposers) dispose() }
        },
        'notes: routes',
      )
    } else if (disposeRoutes !== undefined && !enabled) {
      disposeRoutes()
      disposeRoutes = undefined
    }
  }

  installSettingsSection(
    ctx,
    settingsNamespace(NOTES_SETTINGS_NAMESPACE),
    makeNotesSettingsSchema(),
    base,
    {
      setSource: (source) => { current = source },
      onChange: () => {
        const section = current()
        service.applySettingsSection(section)
        syncRoutes()
      },
    },
  )
  syncRoutes()
}
