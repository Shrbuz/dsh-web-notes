/**
 * Notes panel — the slide-over surface listing every note, searching them,
 * and editing/creating notes. Insert/copy actions live on each list item.
 * @module dsh-web-notes/client/NotesPanel
 */
import { type ReactElement } from 'react';
import type { NotesApi, NoteView } from './api.ts';
import { type NoteKey } from './locales.ts';
/** One staged editor draft. */
export interface NoteDraft {
    /** Present when editing an existing note. */
    id?: string;
    title: string;
    content: string;
    tags: string;
    /** Capture origin for a brand-new note. */
    source?: 'manual' | 'selection' | 'composer';
    /** Session binding for a brand-new note (null = global). */
    sessionId?: string | null;
    /** Editor checkbox: save to global (clear the session binding). */
    global?: boolean;
}
/** Scope tabs the panel offers while a session is current. */
export type NoteScope = 'all' | 'session' | 'global';
/** Props of the notes panel. */
export interface NotesPanelProps {
    api: NotesApi;
    t: (key: string, params?: Record<string, unknown>) => string;
    /** The current session context; null on the new-conversation screen. */
    sessionId: string | null;
    /** New notes default to global (settings preference). */
    defaultGlobal: boolean;
    /** Insert one note into the composer (or copy it when no session is open). Returns a toast copy. */
    onInsert: (note: NoteView) => string;
    /** Close the panel. */
    onClose: () => void;
    /** Refresh the dock badge after any note count change. */
    onChanged?: (count: number) => void;
    /** A draft to open the editor with (selection saves land here). */
    seed?: NoteDraft | null;
    /** Called after the seed draft has been consumed. */
    onSeedConsumed?: () => void;
    /** Register the panel's flush-then-close so the dock's own affordances (the
     *  dock toggle and ESC) persist an in-progress draft too. Pass `null` to
     *  unregister. */
    onRegisterClose?: (requestClose: (() => void) | null) => void;
}
/** The notes panel. */
export declare function NotesPanel(props: NotesPanelProps): ReactElement;
/** Re-export for consumers that type against the injected face. */
export type { NoteKey };
//# sourceMappingURL=NotesPanel.d.ts.map