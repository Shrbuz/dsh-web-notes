/**
 * dsh-web-notes browser-side settings — the `notes` settings-namespace scope the
 * browser mirrors from the Host. The dock and panel read their UI preferences
 * (dock placement, button size, default scope) from here so every change in
 * the settings card applies LIVE to the floating UI, and the card writes back
 * through the same scope.
 * @module dsh-web-notes/client/settings
 */
import type { SettingsScope, SettingsScopeSpec } from '@deepseek-ai/dsh-client-runtime/client';
import type { NotesButtonSize, NotesDockMode } from './api.ts';
/** The three UI preferences the notes settings card edits. */
export interface NotesUiSettings {
    /** Dock placement mode. */
    dockMode: NotesDockMode;
    /** Dock button size preset. */
    buttonSize: NotesButtonSize;
    /** New notes default to global. */
    defaultGlobal: boolean;
}
/** The scope spec the notes client binds against the `notes` namespace. */
export declare const notesSettingsSpec: SettingsScopeSpec<NotesUiSettings>;
/** Defaults the UI falls back to while the scope has no accepted section yet. */
export declare const DEFAULT_UI_SETTINGS: NotesUiSettings;
/** Derive the effective settings from a bound scope (never throws). */
export declare function deriveUiSettings(scope: SettingsScope<NotesUiSettings>): NotesUiSettings;
//# sourceMappingURL=settings.d.ts.map