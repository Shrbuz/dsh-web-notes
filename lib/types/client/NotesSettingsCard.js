import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notes settings card — the `notes` entry inside the web settings surface
 * (设置 → 插件 → 插件配置). Rendered through the `settings.plugin.item` slot
 * keyed by the `notes` namespace; every control writes straight back through
 * the bound settings scope, so changes apply to the floating UI live.
 * @module dsh-web-notes/client/NotesSettingsCard
 */
import { useSyncExternalStore } from 'react';
import { DEFAULT_UI_SETTINGS } from "./settings.js";
/** One select row in the card. */
function SelectField(props) {
    return (_jsxs("label", { className: "dshn-settings-field", children: [_jsx("span", { className: "dshn-settings-label", children: props.label }), _jsx("select", { className: "dshn-settings-control", "data-dsh-part": props.dataPart, value: props.value, onChange: (event) => { props.onChange(event.target.value); }, children: props.options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), props.hint !== undefined ? _jsx("span", { className: "dshn-settings-hint", children: props.hint }) : null] }));
}
/** The notes plugin card in 设置 → 插件 → 插件配置. */
export function NotesSettingsCard(props) {
    const { scope, notesT } = props;
    // Reactively mirror the scope: external edits (another surface, or the Host
    // document changing) refresh the controls in place.
    const snapshot = useSyncExternalStore((listener) => scope.subscribe(listener), () => scope.getSnapshot());
    if (snapshot.status === 'unavailable')
        return null;
    const value = snapshot.value ?? DEFAULT_UI_SETTINGS;
    const setDockMode = (next) => { void scope.set('dockMode', next); };
    const setButtonSize = (next) => { void scope.set('buttonSize', next); };
    const setDefaultGlobal = (checked) => {
        if (checked)
            void scope.set('defaultGlobal', true);
        else
            void scope.unset('defaultGlobal');
    };
    return (_jsxs("li", { className: "dshn-settings-card", "data-dsh-part": "notes-settings-card", children: [_jsxs("div", { className: "dshn-settings-head", children: [_jsx("span", { className: "dshn-settings-name", children: notesT('notes.settings.title') }), _jsx("span", { className: "dshn-settings-description", children: notesT('notes.settings.description') })] }), _jsxs("div", { className: "dshn-settings-body", children: [_jsx(SelectField, { label: notesT('notes.settings.dockMode'), value: value.dockMode, dataPart: "notes-setting-dockMode", onChange: (next) => { setDockMode(next === 'fixed' ? 'fixed' : 'floating'); }, options: [
                            { value: 'floating', label: notesT('notes.settings.dockModeFloating') },
                            { value: 'fixed', label: notesT('notes.settings.dockModeFixed') },
                        ], hint: notesT('notes.settings.dockModeHint') }), _jsx(SelectField, { label: notesT('notes.settings.buttonSize'), value: value.buttonSize, dataPart: "notes-setting-buttonSize", onChange: (next) => {
                            setButtonSize(next === 'small' || next === 'regular' ? next : 'large');
                        }, options: [
                            { value: 'small', label: notesT('notes.settings.buttonSizeSmall') },
                            { value: 'regular', label: notesT('notes.settings.buttonSizeRegular') },
                            { value: 'large', label: notesT('notes.settings.buttonSizeLarge') },
                        ] }), _jsxs("label", { className: "dshn-settings-field dshn-settings-check-row", children: [_jsxs("span", { className: "dshn-settings-label", children: [_jsx("input", { type: "checkbox", className: "dshn-check", "data-dsh-part": "notes-setting-defaultGlobal", checked: value.defaultGlobal, onChange: (event) => { setDefaultGlobal(event.target.checked); } }), notesT('notes.settings.defaultGlobal')] }), _jsx("span", { className: "dshn-settings-hint", children: notesT('notes.settings.defaultGlobalHint') })] })] })] }));
}
