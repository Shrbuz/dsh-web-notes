/**
 * Notes persistence — one JSON store under $DSH_HOME/notes/notes.json with
 * atomic rename writes and tolerant reads (corrupt or missing file → empty
 * store). Notes may carry credentials and other sensitive values; they are
 * stored PLAINTEXT on the local disk on purpose (like ~/.dsh/credentials
 * files) — see the README security section.
 * @module dsh-web-notes/persist
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dshHome } from './dsh-home.ts'

/** How a note was captured. */
export type NoteSource = 'manual' | 'selection' | 'composer'

/** One persisted note. */
export interface Note {
  /** Stable identity (UUID v4). */
  id: string
  /** Short title. */
  title: string
  /** Note body — commands, credentials, parameter values, whatever matters. */
  content: string
  /** Free-form tags (lowercased, trimmed, deduped). */
  tags: string[]
  /** Capture origin. */
  source: NoteSource
  /**
   * Session this note is bound to (visible only while that session is
   * current). Absent = a GLOBAL note, visible in every session and on the
   * new-conversation screen.
   */
  sessionId?: string
  /** Epoch ms of creation. */
  createdAt: number
  /** Epoch ms of last edit. */
  updatedAt: number
}

/** The persisted document. */
export interface NotesPersist {
  notes: Note[]
}

/** Title length cap (chars). */
export const NOTE_TITLE_MAX = 200
/** Content length cap (chars). */
export const NOTE_CONTENT_MAX = 200_000
/** Tags per note. */
export const NOTE_TAGS_MAX = 20
/** Tag length cap (chars). */
export const NOTE_TAG_MAX = 32
/** Total notes cap — protects the store from runaway growth. */
export const NOTES_MAX = 5000
/** Default title when the caller supplies none. */
export const DEFAULT_NOTE_TITLE = '未命名笔记'

/** Persistence directory: $DSH_HOME/notes (or ~/.dsh/notes). */
export function notesHomeDir(): string {
  return join(dshHome(), 'notes')
}

export function emptyPersist(): NotesPersist {
  return { notes: [] }
}

/** Numeric field guard: finite numbers only, else the fallback. */
function finiteNum(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** String field guard with an optional length cap. */
function str(value: unknown, fallback: string, max?: number): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (trimmed === '') return fallback
  return max === undefined ? trimmed : trimmed.slice(0, max)
}

/** Sanitize the tags array (lowercased, trimmed, deduped, capped). */
export function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of value) {
    if (typeof raw !== 'string') continue
    const tag = raw.trim().toLowerCase().slice(0, NOTE_TAG_MAX)
    if (tag === '' || seen.has(tag)) continue
    seen.add(tag)
    out.push(tag)
    if (out.length >= NOTE_TAGS_MAX) break
  }
  return out
}

/** Load the persisted document; missing/corrupt files fall back to empty. */
export function loadNotesPersist(dir: string = notesHomeDir()): NotesPersist {
  try {
    const raw = readFileSync(join(dir, 'notes.json'), 'utf8')
    const parsed = JSON.parse(raw) as { notes?: unknown }
    if (!Array.isArray(parsed.notes)) return emptyPersist()
    const notes: Note[] = []
    for (const item of parsed.notes.slice(0, NOTES_MAX)) {
      if (typeof item !== 'object' || item === null) continue
      const record = item as Record<string, unknown>
      const id = str(record.id, '', 64)
      if (id === '') continue
      const title = str(record.title, DEFAULT_NOTE_TITLE, NOTE_TITLE_MAX)
      const content = typeof record.content === 'string'
        ? record.content.slice(0, NOTE_CONTENT_MAX)
        : ''
      if (title === DEFAULT_NOTE_TITLE && content === '') continue
      const sourceRaw = record.source
      const source: NoteSource = sourceRaw === 'selection' || sourceRaw === 'composer' || sourceRaw === 'manual'
        ? sourceRaw
        : 'manual'
      const sessionRaw = record.sessionId
      const sessionId = typeof sessionRaw === 'string' && sessionRaw.trim() !== ''
        ? sessionRaw.trim().slice(0, 64)
        : undefined
      notes.push({
        id,
        title,
        content,
        tags: sanitizeTags(record.tags),
        source,
        ...(sessionId === undefined ? {} : { sessionId }),
        createdAt: finiteNum(record.createdAt, 0),
        updatedAt: finiteNum(record.updatedAt, 0),
      })
    }
    notes.sort((a, b) => b.updatedAt - a.updatedAt)
    return { notes }
  } catch {
    return emptyPersist()
  }
}

/** Atomically persist the document (write temp + rename). */
export function saveNotesPersist(data: NotesPersist, dir: string = notesHomeDir()): void {
  mkdirSync(dir, { recursive: true })
  const target = join(dir, 'notes.json')
  const tmp = `${target}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, target)
}
