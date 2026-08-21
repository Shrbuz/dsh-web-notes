/**
 * dsh-web-notes browser-side settings — the `notes` settings-namespace scope the
 * browser mirrors from the Host. The dock and panel read their UI preferences
 * (dock placement, button size, default scope) from here so every change in
 * the settings card applies LIVE to the floating UI, and the card writes back
 * through the same scope.
 * @module dsh-web-notes/client/settings
 */

import type { SettingsScope, SettingsScopeSpec } from '@deepseek-ai/dsh-client-runtime/client'
import type { NotesButtonSize, NotesDockMode } from './api.ts'

/** The three UI preferences the notes settings card edits. */
export interface NotesUiSettings {
  /** Dock placement mode. */
  dockMode: NotesDockMode
  /** Dock button size preset. */
  buttonSize: NotesButtonSize
  /** New notes default to global. */
  defaultGlobal: boolean
}

/** Schema-resolved section of the `notes` namespace (host-side mirror). */
interface NotesWireSection {
  enabled?: unknown
  selectionCapture?: unknown
  dockMode?: unknown
  buttonSize?: unknown
  defaultGlobal?: unknown
}

/** Normalize an unknown section value to the UI settings (lenient). */
function decodeSection(section: unknown): NotesUiSettings | undefined {
  if (typeof section !== 'object' || section === null) return undefined
  const value = section as NotesWireSection
  return {
    dockMode: value.dockMode === 'fixed' ? 'fixed' : 'floating',
    buttonSize: value.buttonSize === 'small' || value.buttonSize === 'regular'
      ? value.buttonSize
      : 'large',
    defaultGlobal: value.defaultGlobal === true,
  }
}

/** The scope spec the notes client binds against the `notes` namespace. */
export const notesSettingsSpec: SettingsScopeSpec<NotesUiSettings> = {
  namespace: 'notes',
  decode: decodeSection,
}

/** Defaults the UI falls back to while the scope has no accepted section yet. */
export const DEFAULT_UI_SETTINGS: NotesUiSettings = {
  dockMode: 'floating',
  buttonSize: 'large',
  defaultGlobal: false,
}

/** Derive the effective settings from a bound scope (never throws). */
export function deriveUiSettings(scope: SettingsScope<NotesUiSettings>): NotesUiSettings {
  return scope.getSnapshot().value ?? DEFAULT_UI_SETTINGS
}
