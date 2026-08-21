/**
 * Notes host service — the CRUD domain behind the browser UI. Owns the
 * in-memory note list (loaded once from disk) and persists every mutation
 * through the atomic JSON store. All browser access goes through the
 * loopback-guarded /api/notes/* routes; this service is also the seam a test
 * or an embedding application can drive directly.
 * @module dsh-web-notes/service
 */
import { randomUUID } from 'node:crypto';
import { Service } from '@deepseek-ai/cordis';
import { DEFAULT_NOTE_TITLE, NOTE_CONTENT_MAX, NOTE_TITLE_MAX, NOTES_MAX, loadNotesPersist, notesHomeDir, sanitizeTags, saveNotesPersist, } from "./persist.js";
/** Settings namespace of the notes capability. */
export const NOTES_SETTINGS_NAMESPACE = 'notes';
function ok(value) {
    return { ok: true, value };
}
function fail(error) {
    return { ok: false, error };
}
/**
 * The notes service (`notes`): scope-free host singleton. The browser half
 * never imports this — it talks to the loopback API routes, keeping the
 * client bundle free of host packages.
 */
export class NotesService extends Service {
    notes;
    dir;
    enabled;
    selectionCapture;
    dockMode;
    buttonSize;
    defaultGlobal;
    constructor(ctx, config = {}) {
        super(ctx, 'notes');
        this.dir = config.persistDir ?? notesHomeDir();
        this.notes = loadNotesPersist(this.dir).notes;
        this.enabled = config.enabled ?? true;
        this.selectionCapture = config.selectionCapture ?? true;
        this.dockMode = config.dockMode ?? 'floating';
        this.buttonSize = config.buttonSize ?? 'large';
        this.defaultGlobal = config.defaultGlobal ?? false;
    }
    /** The settings section mirror (base + live values). */
    settingsSection() {
        return {
            enabled: this.enabled,
            selectionCapture: this.selectionCapture,
            dockMode: this.dockMode,
            buttonSize: this.buttonSize,
            defaultGlobal: this.defaultGlobal,
        };
    }
    applySettingsSection(section) {
        this.enabled = section.enabled;
        this.selectionCapture = section.selectionCapture;
        this.dockMode = section.dockMode;
        this.buttonSize = section.buttonSize;
        this.defaultGlobal = section.defaultGlobal;
    }
    /** Whether the plugin (and its routes) is enabled. */
    isEnabled() {
        return this.enabled;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /** Whether the selection-capture bubble is enabled. */
    isSelectionCaptureEnabled() {
        return this.selectionCapture;
    }
    /** Dock placement mode. */
    dockPlacement() {
        return this.dockMode;
    }
    /** Dock button size preset. */
    dockSize() {
        return this.buttonSize;
    }
    /** Whether new notes default to global. */
    isDefaultGlobal() {
        return this.defaultGlobal;
    }
    /**
     * List notes for the given context, newest-updated first.
     * - scope 'session': notes bound to the current session
     * - scope 'global': notes bound to no session
     * - scope 'all' (default): session-bound notes + global notes; without a
     *   session context (new-conversation screen) this collapses to global only,
     *   so a session's notes never leak onto another screen.
     */
    list(query, opts = {}) {
        const q = query?.trim().toLowerCase();
        const scope = opts.scope ?? 'all';
        const sessionId = typeof opts.sessionId === 'string' && opts.sessionId !== ''
            ? opts.sessionId
            : undefined;
        const inScope = (note) => {
            if (scope === 'session')
                return sessionId !== undefined && note.sessionId === sessionId;
            if (scope === 'global')
                return note.sessionId === undefined;
            // all
            return sessionId === undefined ? note.sessionId === undefined : (note.sessionId === sessionId || note.sessionId === undefined);
        };
        const filtered = this.notes.filter((note) => {
            if (!inScope(note))
                return false;
            if (q === undefined || q === '')
                return true;
            return note.title.toLowerCase().includes(q)
                || note.content.toLowerCase().includes(q)
                || note.tags.some((tag) => tag.includes(q));
        });
        return filtered.map(toView);
    }
    /** Count of notes in the given context (same semantics as list). */
    count(opts = {}) {
        return this.list(undefined, opts).length;
    }
    /** One note by id. */
    get(id) {
        const note = this.notes.find((candidate) => candidate.id === id);
        return note === undefined ? undefined : toView(note);
    }
    /** Create a note. */
    create(input) {
        const content = typeof input.content === 'string' ? input.content.trim() : '';
        if (content === '')
            return fail('note-content-empty');
        if (content.length > NOTE_CONTENT_MAX)
            return fail('note-content-too-long');
        if (this.notes.length >= NOTES_MAX)
            return fail('notes-limit-reached');
        const now = Date.now();
        const title = typeof input.title === 'string' && input.title.trim() !== ''
            ? input.title.trim().slice(0, NOTE_TITLE_MAX)
            : titleFromContent(content);
        const source = input.source === 'selection' || input.source === 'composer' ? input.source : 'manual';
        const sessionId = sanitizeSessionId(input.sessionId);
        const note = {
            id: randomUUID(),
            title,
            content,
            tags: sanitizeTags(input.tags),
            source,
            ...(sessionId === undefined ? {} : { sessionId }),
            createdAt: now,
            updatedAt: now,
        };
        this.notes.unshift(note);
        this.persist();
        return ok(toView(note));
    }
    /** Update title/content/tags/session of one note (updatedAt advances). */
    update(id, patch) {
        const note = this.notes.find((candidate) => candidate.id === id);
        if (note === undefined)
            return fail('note-not-found');
        if (patch.title !== undefined) {
            const title = patch.title.trim();
            note.title = title === '' ? DEFAULT_NOTE_TITLE : title.slice(0, NOTE_TITLE_MAX);
        }
        if (patch.content !== undefined) {
            const content = patch.content.trim();
            if (content === '')
                return fail('note-content-empty');
            if (content.length > NOTE_CONTENT_MAX)
                return fail('note-content-too-long');
            note.content = content;
        }
        if (patch.tags !== undefined) {
            note.tags = sanitizeTags(patch.tags);
        }
        if (patch.sessionId !== undefined) {
            const sessionId = sanitizeSessionId(patch.sessionId);
            if (sessionId === undefined) {
                delete note.sessionId;
            }
            else {
                note.sessionId = sessionId;
            }
        }
        note.updatedAt = Date.now();
        this.persist();
        return ok(toView(note));
    }
    /** Delete one note. */
    remove(id) {
        const before = this.notes.length;
        this.notes = this.notes.filter((note) => note.id !== id);
        const removed = this.notes.length < before;
        if (!removed)
            return fail('note-not-found');
        this.persist();
        return ok({ removed: true });
    }
    /** Delete every note. */
    clear() {
        const cleared = this.notes.length;
        this.notes = [];
        this.persist();
        return ok({ cleared });
    }
    persist() {
        saveNotesPersist({ notes: this.notes }, this.dir);
    }
}
/** First non-empty line of the content, truncated — a title from the body. */
function titleFromContent(content) {
    const line = content.split('\n').find((part) => part.trim() !== '');
    const text = (line ?? DEFAULT_NOTE_TITLE).trim();
    return text.length > 48 ? text.slice(0, 48) + '…' : text;
}
/** Normalize a session binding: valid non-empty string → capped id; anything else → global. */
function sanitizeSessionId(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed.slice(0, 64);
}
function toView(note) {
    return {
        id: note.id,
        title: note.title,
        content: note.content,
        tags: [...note.tags],
        source: note.source,
        ...(note.sessionId === undefined ? {} : { sessionId: note.sessionId }),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
    };
}
