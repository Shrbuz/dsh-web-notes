/**
 * Notes persistence — one JSON store under $DSH_HOME/notes/notes.json with
 * atomic rename writes and tolerant reads (corrupt or missing file → empty
 * store). Notes may carry credentials and other sensitive values; they are
 * stored PLAINTEXT on the local disk on purpose (like ~/.dsh/credentials
 * files) — see the README security section.
 * @module dsh-web-notes/persist
 */
/** How a note was captured. */
export type NoteSource = 'manual' | 'selection' | 'composer';
/** One persisted note. */
export interface Note {
    /** Stable identity (UUID v4). */
    id: string;
    /** Short title. */
    title: string;
    /** Note body — commands, credentials, parameter values, whatever matters. */
    content: string;
    /** Free-form tags (lowercased, trimmed, deduped). */
    tags: string[];
    /** Capture origin. */
    source: NoteSource;
    /**
     * Session this note is bound to (visible only while that session is
     * current). Absent = a GLOBAL note, visible in every session and on the
     * new-conversation screen.
     */
    sessionId?: string;
    /** Epoch ms of creation. */
    createdAt: number;
    /** Epoch ms of last edit. */
    updatedAt: number;
}
/** The persisted document. */
export interface NotesPersist {
    notes: Note[];
}
/** Title length cap (chars). */
export declare const NOTE_TITLE_MAX = 200;
/** Content length cap (chars). */
export declare const NOTE_CONTENT_MAX = 200000;
/** Tags per note. */
export declare const NOTE_TAGS_MAX = 20;
/** Tag length cap (chars). */
export declare const NOTE_TAG_MAX = 32;
/** Total notes cap — protects the store from runaway growth. */
export declare const NOTES_MAX = 5000;
/** Default title when the caller supplies none. */
export declare const DEFAULT_NOTE_TITLE = "\u672A\u547D\u540D\u7B14\u8BB0";
/** Persistence directory: $DSH_HOME/notes (or ~/.dsh/notes). */
export declare function notesHomeDir(): string;
export declare function emptyPersist(): NotesPersist;
/** Sanitize the tags array (lowercased, trimmed, deduped, capped). */
export declare function sanitizeTags(value: unknown): string[];
/** Load the persisted document; missing/corrupt files fall back to empty. */
export declare function loadNotesPersist(dir?: string): NotesPersist;
/** Atomically persist the document (write temp + rename). */
export declare function saveNotesPersist(data: NotesPersist, dir?: string): void;
//# sourceMappingURL=persist.d.ts.map