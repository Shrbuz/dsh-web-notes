import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notes settings card — the `notes` entry inside the web settings surface
 * (设置 → 插件 → 插件配置). Follows the official plugin-card pattern: a
 * collapsible header (name + description + chevron) that expands into the
 * form. Every control writes straight back through the bound settings scope,
 * so changes apply to the floating UI live — no save/discard footer needed.
 * @module dsh-web-notes/client/NotesSettingsCard
 */
import { useSyncExternalStore, useState } from 'react';
import { DEFAULT_UI_SETTINGS } from "./settings.js";
/** Segmented control — the official tab-style picker (no native select). */
function Segmented(props) {
    return (_jsx("div", { className: "dshn-settings-seg", role: "radiogroup", "data-dsh-part": props.dataPart, children: props.options.map((option) => (_jsx("button", { type: "button", role: "radio", "aria-checked": option.value === props.value, className: option.value === props.value ? 'dshn-settings-seg-btn dshn-settings-seg-active' : 'dshn-settings-seg-btn', "data-dsh-part": `${props.dataPart}-${option.value}`, onClick: () => { props.onChange(option.value); }, children: option.label }, option.value))) }));
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
    // Collapsed by default, exactly like the official plugin cards.
    const [open, setOpen] = useState(false);
    const setDockMode = (next) => { void scope.set('dockMode', next); };
    const setButtonSize = (next) => { void scope.set('buttonSize', next); };
    const setDefaultGlobal = (checked) => {
        if (checked)
            void scope.set('defaultGlobal', true);
        else
            void scope.unset('defaultGlobal');
    };
    return (_jsxs("li", { className: open ? 'dshn-settings-card dshn-settings-card-open' : 'dshn-settings-card', "data-dsh-part": "notes-settings-card", children: [_jsxs("button", { type: "button", className: "dshn-settings-header", "aria-expanded": open, "aria-label": open
                    ? notesT('notes.settings.collapse')
                    : notesT('notes.settings.expand'), onClick: () => { setOpen((current) => !current); }, children: [_jsxs("span", { className: "dshn-settings-headText", children: [_jsx("span", { className: "dshn-settings-name", children: notesT('notes.settings.title') }), _jsx("span", { className: "dshn-settings-description", children: notesT('notes.settings.description') })] }), _jsx("svg", { width: "14", height: "14", className: open ? 'dshn-settings-chevron dshn-settings-chevron-open' : 'dshn-settings-chevron', viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z", fill: "currentColor" }) })] }), open ? (_jsxs("div", { className: "dshn-settings-body", children: [_jsxs("div", { className: "dshn-settings-field", children: [_jsx("div", { className: "dshn-settings-label", children: notesT('notes.settings.dockMode') }), _jsx(Segmented, { dataPart: "notes-setting-dockMode", value: value.dockMode, onChange: (next) => { setDockMode(next); }, options: [
                                    { value: 'floating', label: notesT('notes.settings.dockModeFloating') },
                                    { value: 'fixed', label: notesT('notes.settings.dockModeFixed') },
                                ] })] }), _jsxs("div", { className: "dshn-settings-field", children: [_jsx("div", { className: "dshn-settings-label", children: notesT('notes.settings.buttonSize') }), _jsx(Segmented, { dataPart: "notes-setting-buttonSize", value: value.buttonSize, onChange: (next) => { setButtonSize(next); }, options: [
                                    { value: 'small', label: notesT('notes.settings.buttonSizeSmall') },
                                    { value: 'regular', label: notesT('notes.settings.buttonSizeRegular') },
                                    { value: 'large', label: notesT('notes.settings.buttonSizeLarge') },
                                ] })] }), _jsxs("div", { className: "dshn-settings-field dshn-settings-field-switch", children: [_jsx("span", { className: "dshn-settings-label", children: notesT('notes.settings.defaultGlobal') }), _jsxs("label", { className: "dshn-settings-switch", children: [_jsx("input", { type: "checkbox", className: "dshn-check", "data-dsh-part": "notes-setting-defaultGlobal", checked: value.defaultGlobal, onChange: (event) => { setDefaultGlobal(event.target.checked); } }), _jsx("span", { className: "dshn-settings-switch-track", "aria-hidden": "true" })] })] })] })) : null] }));
}
