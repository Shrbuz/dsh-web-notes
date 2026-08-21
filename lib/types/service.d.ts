/**
 * Notes host service — the CRUD domain behind the browser UI. Owns the
 * in-memory note list (loaded once from disk) and persists every mutation
 * through the atomic JSON store. All browser access goes through the
 * loopback-guarded /api/notes/* routes; this service is also the seam a test
 * or an embedding application can drive directly.
 * @module dsh-web-notes/service
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { type NoteSource } from './persist.ts';
/** Dock placement mode. */
export type NotesDockMode = 'floating' | 'fixed';
/** Dock button size preset. */
export type NotesButtonSize = 'small' | 'regular' | 'large';
/** Plugin configuration. */
export interface NotesConfig {
    /** Persistence directory override (defaults to $DSH_HOME/notes). */
    persistDir?: string;
    /** Master switch for the plugin (browser half + host routes). */
    enabled?: boolean;
    /** Whether the text-selection capture bubble is active (browser half reads it). */
    selectionCapture?: boolean;
    /** Dock placement: floating (draggable, right edge) or fixed (chat window top-right). */
    dockMode?: NotesDockMode;
    /** Dock button size preset (large = the original 80 px). */
    buttonSize?: NotesButtonSize;
    /** New notes default to global (visible in every session) instead of the current session. */
    defaultGlobal?: boolean;
}
/** The settings-namespace section the web settings surface edits. */
export interface NotesSettingsSection {
    /** Master switch. */
    enabled: boolean;
    /** Text-selection capture bubble. */
    selectionCapture: boolean;
    /** Dock placement mode. */
    dockMode: NotesDockMode;
    /** Dock button size preset. */
    buttonSize: NotesButtonSize;
    /** New notes default to global. */
    defaultGlobal: boolean;
}
/** Settings namespace of the notes capability. */
export declare const NOTES_SETTINGS_NAMESPACE = "notes";
/** One create request. */
export interface NoteInput {
    title?: string;
    content: string;
    tags?: string[];
    source?: NoteSource;
    /** Bound session; null/undefined/empty = global note. */
    sessionId?: string | null;
}
/** Scope filter for list queries. */
export type NoteScopeFilter = 'all' | 'session' | 'global';
/** List query options. */
export interface NoteListOptions {
    /** The current session context; absent on the new-conversation screen. */
    sessionId?: string | null;
    /** Which pool to return (default 'all'). */
    scope?: NoteScopeFilter;
}
/** The public note view sent to the browser (id, title, content, tags, source, session, timestamps). */
export interface NoteView {
    id: string;
    title: string;
    content: string;
    tags: string[];
    source: NoteSource;
    /** Bound session id; absent = global note. */
    sessionId?: string;
    createdAt: number;
    updatedAt: number;
}
/** Result of a mutation that can fail on validation. */
export type NotesResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: string;
};
/**
 * The notes service (`notes`): scope-free host singleton. The browser half
 * never imports this — it talks to the loopback API routes, keeping the
 * client bundle free of host packages.
 */
export declare class NotesService extends Service {
    private notes;
    private readonly dir;
    private enabled;
    private selectionCapture;
    private dockMode;
    private buttonSize;
    private defaultGlobal;
    constructor(ctx: Context, config?: NotesConfig);
    /** The settings section mirror (base + live values). */
    settingsSection(): NotesSettingsSection;
    applySettingsSection(section: NotesSettingsSection): void;
    /** Whether the plugin (and its routes) is enabled. */
    isEnabled(): boolean;
    setEnabled(enabled: boolean): void;
    /** Whether the selection-capture bubble is enabled. */
    isSelectionCaptureEnabled(): boolean;
    /** Dock placement mode. */
    dockPlacement(): NotesDockMode;
    /** Dock button size preset. */
    dockSize(): NotesButtonSize;
    /** Whether new notes default to global. */
    isDefaultGlobal(): boolean;
    /**
     * List notes for the given context, newest-updated first.
     * - scope 'session': notes bound to the current session
     * - scope 'global': notes bound to no session
     * - scope 'all' (default): session-bound notes + global notes; without a
     *   session context (new-conversation screen) this collapses to global only,
     *   so a session's notes never leak onto another screen.
     */
    list(query?: string, opts?: NoteListOptions): NoteView[];
    /** Count of notes in the given context (same semantics as list). */
    count(opts?: NoteListOptions): number;
    /** One note by id. */
    get(id: string): NoteView | undefined;
    /** Create a note. */
    create(input: NoteInput): NotesResult<NoteView>;
    /** Update title/content/tags/session of one note (updatedAt advances). */
    update(id: string, patch: {
        title?: string;
        content?: string;
        tags?: string[];
        sessionId?: string | null;
    }): NotesResult<NoteView>;
    /** Delete one note. */
    remove(id: string): NotesResult<{
        removed: boolean;
    }>;
    /** Delete every note. */
    clear(): NotesResult<{
        cleared: number;
    }>;
    private persist;
}
//# sourceMappingURL=service.d.ts.map