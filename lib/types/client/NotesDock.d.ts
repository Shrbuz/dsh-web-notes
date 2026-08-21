/**
 * Notes dock — the floating entry (right edge, vertically centered), the
 * slide-over panel it toggles, and the text-selection capture bubble that
 * appears when the user selects text on the page (e.g. an AI answer) so it
 * can be saved as a note with one click.
 *
 * Dock interaction: drag to reposition (position persists in localStorage),
 * click to toggle the panel. The selection bubble FOLLOWS the selection while
 * the page scrolls, and hides only when the selection collapses, the user
 * clicks elsewhere on the page, or the window loses focus.
 * @module dsh-web-notes/client/NotesDock
 */
import { type ReactElement } from 'react';
import type { ISessions, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { NotesApi, NoteView } from './api.ts';
import type { NotesUiSettings } from './settings.ts';
/** Props of the notes dock. */
export interface NotesDockProps {
    api: NotesApi;
    t: (key: string, params?: Record<string, unknown>) => string;
    /** Insert one note into the composer (or copy it when no session is open). Returns a toast copy. */
    onInsert: (note: NoteView) => string;
    /** Whether the selection-capture bubble is enabled (host switch). */
    selectionCapture: boolean;
    /** The sessions service, so the dock knows the current session for scoping. */
    sessions: ISessions;
    /** The bound `notes` settings scope: dock mode + button size + default scope, live. */
    settingsScope: SettingsScope<NotesUiSettings>;
}
/** The floating notes dock. */
export declare function NotesDock(props: NotesDockProps): ReactElement;
//# sourceMappingURL=NotesDock.d.ts.map