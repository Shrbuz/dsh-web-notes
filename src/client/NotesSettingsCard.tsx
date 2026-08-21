/**
 * Notes settings card — the `notes` entry inside the web settings surface
 * (设置 → 插件 → 插件配置). Rendered through the `settings.plugin.item` slot
 * keyed by the `notes` namespace; every control writes straight back through
 * the bound settings scope, so changes apply to the floating UI live.
 * @module dsh-web-notes/client/NotesSettingsCard
 */

import { useSyncExternalStore, type ReactElement } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { NotesButtonSize, NotesDockMode } from './api.ts'
import type { NotesUiSettings } from './settings.ts'
import { DEFAULT_UI_SETTINGS } from './settings.ts'

/** Props of the notes settings card (injected through the slot entry). */
export interface NotesSettingsCardProps {
  /** The bound `notes` settings scope (reads + writes). */
  scope: SettingsScope<NotesUiSettings>
  /** Translation helper (notes locale dictionary). */
  notesT: (key: string) => string
}

/** One select row in the card. */
function SelectField(props: {
  label: string
  value: string
  dataPart: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  hint?: string
}): ReactElement {
  return (
    <label className="dshn-settings-field">
      <span className="dshn-settings-label">{props.label}</span>
      <select
        className="dshn-settings-control"
        data-dsh-part={props.dataPart}
        value={props.value}
        onChange={(event) => { props.onChange(event.target.value) }}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {props.hint !== undefined ? <span className="dshn-settings-hint">{props.hint}</span> : null}
    </label>
  )
}

/** The notes plugin card in 设置 → 插件 → 插件配置. */
export function NotesSettingsCard(props: NotesSettingsCardProps): ReactElement | null {
  const { scope, notesT } = props
  // Reactively mirror the scope: external edits (another surface, or the Host
  // document changing) refresh the controls in place.
  const snapshot = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  if (snapshot.status === 'unavailable') return null
  const value = snapshot.value ?? DEFAULT_UI_SETTINGS

  const setDockMode = (next: NotesDockMode): void => { void scope.set('dockMode', next) }
  const setButtonSize = (next: NotesButtonSize): void => { void scope.set('buttonSize', next) }
  const setDefaultGlobal = (checked: boolean): void => {
    if (checked) void scope.set('defaultGlobal', true)
    else void scope.unset('defaultGlobal')
  }

  return (
    <li className="dshn-settings-card" data-dsh-part="notes-settings-card">
      <div className="dshn-settings-head">
        <span className="dshn-settings-name">{notesT('notes.settings.title')}</span>
        <span className="dshn-settings-description">{notesT('notes.settings.description')}</span>
      </div>
      <div className="dshn-settings-body">
        <SelectField
          label={notesT('notes.settings.dockMode')}
          value={value.dockMode}
          dataPart="notes-setting-dockMode"
          onChange={(next) => { setDockMode(next === 'fixed' ? 'fixed' : 'floating') }}
          options={[
            { value: 'floating', label: notesT('notes.settings.dockModeFloating') },
            { value: 'fixed', label: notesT('notes.settings.dockModeFixed') },
          ]}
          hint={notesT('notes.settings.dockModeHint')}
        />
        <SelectField
          label={notesT('notes.settings.buttonSize')}
          value={value.buttonSize}
          dataPart="notes-setting-buttonSize"
          onChange={(next) => {
            setButtonSize(next === 'small' || next === 'regular' ? next : 'large')
          }}
          options={[
            { value: 'small', label: notesT('notes.settings.buttonSizeSmall') },
            { value: 'regular', label: notesT('notes.settings.buttonSizeRegular') },
            { value: 'large', label: notesT('notes.settings.buttonSizeLarge') },
          ]}
        />
        <label className="dshn-settings-field dshn-settings-check-row">
          <span className="dshn-settings-label">
            <input
              type="checkbox"
              className="dshn-check"
              data-dsh-part="notes-setting-defaultGlobal"
              checked={value.defaultGlobal}
              onChange={(event) => { setDefaultGlobal(event.target.checked) }}
            />
            {notesT('notes.settings.defaultGlobal')}
          </span>
          <span className="dshn-settings-hint">{notesT('notes.settings.defaultGlobalHint')}</span>
        </label>
      </div>
    </li>
  )
}
