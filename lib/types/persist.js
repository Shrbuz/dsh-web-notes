/**
 * Notes persistence — one JSON store under $DSH_HOME/notes/notes.json with
 * atomic rename writes and tolerant reads (corrupt or missing file → empty
 * store). Notes may carry credentials and other sensitive values; they are
 * stored PLAINTEXT on the local disk on purpose (like ~/.dsh/credentials
 * files) — see the README security section.
 * @module dsh-web-notes/persist
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dshHome } from "./dsh-home.js";
/** Title length cap (chars). */
export const NOTE_TITLE_MAX = 200;
/** Content length cap (chars). */
export const NOTE_CONTENT_MAX = 200_000;
/** Tags per note. */
export const NOTE_TAGS_MAX = 20;
/** Tag length cap (chars). */
export const NOTE_TAG_MAX = 32;
/** Total notes cap — protects the store from runaway growth. */
export const NOTES_MAX = 5000;
/** Default title when the caller supplies none. */
export const DEFAULT_NOTE_TITLE = '未命名笔记';
/** Persistence directory: $DSH_HOME/notes (or ~/.dsh/notes). */
export function notesHomeDir() {
    return join(dshHome(), 'notes');
}
export function emptyPersist() {
    return { notes: [] };
}
/** Numeric field guard: finite numbers only, else the fallback. */
function finiteNum(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
/** String field guard with an optional length cap. */
function str(value, fallback, max) {
    if (typeof value !== 'string')
        return fallback;
    const trimmed = value.trim();
    if (trimmed === '')
        return fallback;
    return max === undefined ? trimmed : trimmed.slice(0, max);
}
/** Sanitize the tags array (lowercased, trimmed, deduped, capped). */
export function sanitizeTags(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    const out = [];
    for (const raw of value) {
        if (typeof raw !== 'string')
            continue;
        const tag = raw.trim().toLowerCase().slice(0, NOTE_TAG_MAX);
        if (tag === '' || seen.has(tag))
            continue;
        seen.add(tag);
        out.push(tag);
        if (out.length >= NOTE_TAGS_MAX)
            break;
    }
    return out;
}
/** Load the persisted document; missing/corrupt files fall back to empty. */
export function loadNotesPersist(dir = notesHomeDir()) {
    try {
        const raw = readFileSync(join(dir, 'notes.json'), 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.notes))
            return emptyPersist();
        const notes = [];
        for (const item of parsed.notes.slice(0, NOTES_MAX)) {
            if (typeof item !== 'object' || item === null)
                continue;
            const record = item;
            const id = str(record.id, '', 64);
            if (id === '')
                continue;
            const title = str(record.title, DEFAULT_NOTE_TITLE, NOTE_TITLE_MAX);
            const content = typeof record.content === 'string'
                ? record.content.slice(0, NOTE_CONTENT_MAX)
                : '';
            if (title === DEFAULT_NOTE_TITLE && content === '')
                continue;
            const sourceRaw = record.source;
            const source = sourceRaw === 'selection' || sourceRaw === 'composer' || sourceRaw === 'manual'
                ? sourceRaw
                : 'manual';
            const sessionRaw = record.sessionId;
            const sessionId = typeof sessionRaw === 'string' && sessionRaw.trim() !== ''
                ? sessionRaw.trim().slice(0, 64)
                : undefined;
            notes.push({
                id,
                title,
                content,
                tags: sanitizeTags(record.tags),
                source,
                ...(sessionId === undefined ? {} : { sessionId }),
                createdAt: finiteNum(record.createdAt, 0),
                updatedAt: finiteNum(record.updatedAt, 0),
            });
        }
        notes.sort((a, b) => b.updatedAt - a.updatedAt);
        return { notes };
    }
    catch {
        return emptyPersist();
    }
}
/** Atomically persist the document (write temp + rename). */
export function saveNotesPersist(data, dir = notesHomeDir()) {
    mkdirSync(dir, { recursive: true });
    const target = join(dir, 'notes.json');
    const tmp = `${target}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    renameSync(tmp, target);
}
