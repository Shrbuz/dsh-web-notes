/**
 * Standalone verification harness for the notes browser UI.
 *
 * WHY THIS EXISTS: dsh 0.1.5 added browser authentication (a process-random
 * launch token minting a signed cookie), so a fresh headless browser can no
 * longer load the running GUI — the existing `scripts/cdp-*.mjs` probes get a
 * 401 on `/` and the app never boots. This harness renders the REAL
 * `NotesDock` component tree with the REAL `NOTES_CSS` against mocked
 * services, so the client UI can still be driven and asserted over CDP without
 * touching the live server or the user's $DSH_HOME.
 *
 * Everything mocked here is a *contract* the host owns: the notes API, the
 * sessions snapshot store and the settings scope. The component under test,
 * its styles and its copy are the real ones from `src/client/`.
 *
 * Bundle: `tsdown --config tsdown.harness.config.ts` -> .logs/harness/harness.js
 * Driver: `node scripts/verify-touch.mjs`
 */
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { NoteView, NotesApi, NotesState } from '../../src/client/api.ts'
import { t } from '../../src/client/locales.ts'
import { NotesDock } from '../../src/client/NotesDock.tsx'
import type { NotesUiSettings } from '../../src/client/settings.ts'
import { NOTES_CSS } from '../../src/client/styles.ts'

/** Recorded host calls, so the driver can assert what a dismissal persisted. */
interface Call {
  fn: 'create' | 'update' | 'remove'
  args: unknown
}

const calls: Call[] = []
const now = Date.now()

const NOTES: NoteView[] = [
  {
    id: 'n1',
    title: '部署命令',
    content: 'pnpm install && pnpm build',
    tags: ['dev', 'build'],
    source: 'manual',
    sessionId: 'harness-session',
    createdAt: now - 60_000,
    updatedAt: now - 60_000,
  },
  {
    id: 'n2',
    title: '生产凭证',
    content: 'token=abc123（示例）',
    tags: [],
    source: 'selection',
    sessionId: 'harness-session',
    createdAt: now - 3_600_000,
    updatedAt: now - 3_600_000,
  },
  {
    id: 'n3',
    title: '全局参数',
    content: '--profile web --registry https://registry.npmjs.org/',
    tags: ['cli'],
    source: 'manual',
    createdAt: now - 86_400_000,
    updatedAt: now - 86_400_000,
  },
]

const api: NotesApi = {
  state: async (): Promise<NotesState> => ({
    enabled: true,
    selectionCapture: true,
    dockMode: 'floating',
    buttonSize: 'large',
    defaultGlobal: false,
  }),
  list: async () => ({ notes: NOTES, count: NOTES.length }),
  create: async (input) => {
    calls.push({ fn: 'create', args: input })
    return {
      ok: true,
      value: {
        id: 'created',
        title: input.title ?? '',
        content: input.content,
        tags: input.tags ?? [],
        source: input.source ?? 'manual',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  },
  update: async (id, patch) => {
    calls.push({ fn: 'update', args: { id, patch } })
    return { ok: true, value: { ...NOTES[0], id } }
  },
  remove: async (id) => {
    calls.push({ fn: 'remove', args: { id } })
    return { ok: true, value: { removed: true } }
  },
}

// ---- mocked host contracts -------------------------------------------------

/** The settings scope the dock reads live (see settings.ts: getSnapshot().value). */
let uiValue: NotesUiSettings = { dockMode: 'floating', buttonSize: 'large', defaultGlobal: false }
// The snapshot identity must be STABLE between mutations: useSyncExternalStore
// compares snapshots with Object.is, so returning a fresh wrapper object on
// every call would re-render forever (React error #185).
let uiSnapshot: { value: NotesUiSettings } = { value: uiValue }
const uiListeners = new Set<() => void>()
const settingsScope = {
  subscribe: (listener: () => void): (() => void) => {
    uiListeners.add(listener)
    return () => { uiListeners.delete(listener) }
  },
  getSnapshot: (): { value: NotesUiSettings } => uiSnapshot,
}

/** The sessions snapshot store the dock derives the current session from. */
const SESSION_SNAPSHOT: { current: string | undefined } = { current: 'harness-session' }
const sessions = {
  list: {
    subscribe: (): (() => void) => () => {},
    getSnapshot: (): { current: string | undefined } => SESSION_SNAPSHOT,
  },
}

// ---- mount exactly as src/client/index.ts does -----------------------------

const styleTag = document.createElement('style')
styleTag.dataset.plugin = 'dsh-web-notes'
styleTag.dataset.pluginCss = 'dsh-web-notes/styles'
styleTag.textContent = NOTES_CSS
document.head.appendChild(styleTag)

const container = document.createElement('div')
container.dataset.dshNotesRoot = ''
container.dataset.dshPlugin = 'notes'
document.body.appendChild(container)

createRoot(container).render(createElement(NotesDock, {
  api,
  t,
  sessions: sessions as never,
  settingsScope: settingsScope as never,
  selectionCapture: true,
  onInsert: () => t('notes.item.inserted'),
  onInsertText: () => t('notes.selection.inserted'),
}))

/** Driver surface: inspect/record host calls and flip live UI settings. */
;(window as unknown as { __harness: unknown }).__harness = {
  getCalls: (): Call[] => calls.map((call) => ({ ...call })),
  reset: (): void => { calls.length = 0 },
  setUiSettings: (next: Partial<NotesUiSettings>): void => {
    uiValue = { ...uiValue, ...next }
    uiSnapshot = { value: uiValue }
    for (const listener of uiListeners) listener()
  },
}
