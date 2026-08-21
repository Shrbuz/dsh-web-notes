/**
 * Notes browser API — same-origin JSON endpoints served by the host half
 * (loopback-guarded /api/notes/*). The client bundle never imports host
 * packages; this is its only channel to the notes store.
 * @module dsh-web-notes/client/api
 */

/** One note as the browser sees it. */
export interface NoteView {
  id: string
  title: string
  content: string
  tags: string[]
  source: 'manual' | 'selection' | 'composer'
  /** Bound session id; absent = global note (visible in every session). */
  sessionId?: string
  createdAt: number
  updatedAt: number
}

/** Dock placement mode. */
export type NotesDockMode = 'floating' | 'fixed'

/** Dock button size preset. */
export type NotesButtonSize = 'small' | 'regular' | 'large'

/** Plugin switches mirrored from the host. */
export interface NotesState {
  enabled: boolean
  selectionCapture: boolean
  /** Dock placement mode. */
  dockMode: NotesDockMode
  /** Dock button size preset. */
  buttonSize: NotesButtonSize
  /** New notes default to global. */
  defaultGlobal: boolean
}

/** List scope filter. */
export type NoteScopeFilter = 'all' | 'session' | 'global'

/** List query options. */
export interface NoteListOptions {
  /** Current session context; omit on the new-conversation screen. */
  session?: string | null
  scope?: NoteScopeFilter
}

/** One API result carrying a value or a business error. */
export type NotesResult<T> = { ok: true; value: T } | { ok: false; error: string }

/** The full browser-side notes API. */
export interface NotesApi {
  state(): Promise<NotesState>
  list(query?: string, opts?: NoteListOptions): Promise<{ notes: NoteView[]; count: number }>
  create(input: {
    title?: string
    content: string
    tags?: string[]
    source?: 'manual' | 'selection' | 'composer'
    sessionId?: string | null
  }): Promise<NotesResult<NoteView>>
  update(id: string, patch: { title?: string; content?: string; tags?: string[]; sessionId?: string | null }): Promise<NotesResult<NoteView>>
  remove(id: string): Promise<NotesResult<{ removed: boolean }>>
}

/** Same-origin JSON fetch helper (GET without body, POST with JSON body). */
async function notesFetch<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined
    ? {}
    : {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
  if (!response.ok) {
    throw new Error('notes ' + path + ' failed: ' + response.status)
  }
  return (await response.json()) as T
}

/** The live API instance (failures surface per call). */
export function createNotesApi(): NotesApi {
  return {
    state: () => notesFetch('/api/notes/state'),
    list: (query, opts) => {
      const params = new URLSearchParams()
      if (query !== undefined && query.trim() !== '') params.set('q', query.trim())
      if (typeof opts?.session === 'string' && opts.session !== '') params.set('session', opts.session)
      if (opts?.scope !== undefined && opts.scope !== 'all') params.set('scope', opts.scope)
      const suffix = params.toString()
      return notesFetch('/api/notes/list' + (suffix === '' ? '' : '?' + suffix))
    },
    create: (input) => notesFetch('/api/notes/create', input),
    update: (id, patch) => notesFetch('/api/notes/update', { id, ...patch }),
    remove: (id) => notesFetch('/api/notes/delete', { id }),
  }
}
