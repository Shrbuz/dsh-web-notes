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
import { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
import { type NotesConfig } from './service.ts';
export { NotesService, NOTES_SETTINGS_NAMESPACE } from './service.ts';
export type { NoteView, NotesConfig, NotesResult, NotesSettingsSection, } from './service.ts';
export type { NotesButtonSize, NotesDockMode } from './service.ts';
export { NOTES_API_PREFIX, makeNotesRoutes, } from './routes.ts';
export type { Note, NoteSource, NotesPersist } from './persist.ts';
export { DEFAULT_NOTE_TITLE, NOTE_CONTENT_MAX, NOTE_TAGS_MAX, NOTE_TITLE_MAX, NOTES_MAX, loadNotesPersist, notesHomeDir, saveNotesPersist, } from './persist.ts';
export { dshHome } from './dsh-home.ts';
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export declare const name = "notes";
/** Services required before the notes plugin can mount its surfaces. */
export declare const inject: string[];
/**
 * Settings schema: enable switches for the browser half plus the UI
 * preferences (dock placement, button size, default scope). The browser
 * half reads them through its settings scope AND the state endpoint.
 */
export declare function makeNotesSettingsSchema(): z<Schemastery.ObjectS<{
    enabled: z<boolean, boolean>;
    selectionCapture: z<boolean, boolean>;
    dockMode: z<"fixed" | "floating", "fixed" | "floating">;
    buttonSize: z<"small" | "regular" | "large", "small" | "regular" | "large">;
    defaultGlobal: z<boolean, boolean>;
}>, Schemastery.ObjectT<{
    enabled: z<boolean, boolean>;
    selectionCapture: z<boolean, boolean>;
    dockMode: z<"fixed" | "floating", "fixed" | "floating">;
    buttonSize: z<"small" | "regular" | "large", "small" | "regular" | "large">;
    defaultGlobal: z<boolean, boolean>;
}>>;
/** Register the notes service and its API routes on the context. */
export declare const apply: typeof applyImpl;
declare function applyImpl(ctx: Context, config?: NotesConfig): void;
//# sourceMappingURL=index.d.ts.map