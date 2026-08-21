import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Notes panel — the slide-over surface listing every note, searching them,
 * and editing/creating notes. Insert/copy actions live on each list item.
 * @module dsh-web-notes/client/NotesPanel
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { relativeTime } from "./locales.js";
import { detectMarkdown, renderMarkdown } from "./markdown.js";
const SEARCH_DEBOUNCE_MS = 300;
/** The notes panel. */
export function NotesPanel(props) {
    const { api, t, onInsert, onClose, onChanged, seed, onSeedConsumed } = props;
    const sessionId = props.sessionId;
    const [notes, setNotes] = useState(null);
    const [count, setCount] = useState(0);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState(sessionId === null ? 'global' : 'all');
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [mdMode, setMdMode] = useState('edit');
    const searchTimer = useRef(undefined);
    const contentRef = useRef(null);
    const showToast = useCallback((text) => {
        setToast(text);
        window.setTimeout(() => {
            setToast((current) => (current === text ? null : current));
        }, 2200);
    }, []);
    const load = useCallback(async (q, activeScope) => {
        try {
            const result = await api.list(q, {
                session: props.sessionId,
                scope: activeScope,
            });
            setNotes(result.notes);
            setCount(result.count);
            setError(null);
            onChanged?.(result.count);
        }
        catch {
            setError('load-failed');
        }
    }, [api, props.sessionId, onChanged]);
    // Initial load + refresh whenever the panel reopens or the context changes.
    useEffect(() => {
        void load(query, scope);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, sessionId]);
    // Seed: the dock asks the panel to open the editor with a prefilled draft.
    useEffect(() => {
        if (seed === undefined || seed === null)
            return;
        setEditing({
            ...seed,
            // A seed without an explicit global flag follows the context: without a
            // session everything is global anyway.
            global: seed.global ?? props.sessionId === null,
        });
        setQuery('');
        onSeedConsumed?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seed]);
    // Debounced search.
    const onSearch = (text) => {
        setQuery(text);
        if (searchTimer.current !== undefined)
            window.clearTimeout(searchTimer.current);
        searchTimer.current = window.setTimeout(() => {
            void load(text.trim(), scope);
        }, SEARCH_DEBOUNCE_MS);
    };
    const changeScope = (next) => {
        setScope(next);
        void load(query, next);
    };
    useEffect(() => () => {
        if (searchTimer.current !== undefined)
            window.clearTimeout(searchTimer.current);
    }, []);
    // Focus the content area when the editor opens.
    useEffect(() => {
        if (editing !== null) {
            window.setTimeout(() => { contentRef.current?.focus(); }, 30);
        }
    }, [editing]);
    const startNew = (source = 'manual') => {
        setEditing({
            title: '',
            content: '',
            tags: '',
            source,
            // New notes default to the current session (or global when the "default
            // save global" preference is on); the editor can opt into global via
            // its checkbox.
            sessionId: props.sessionId,
            global: props.defaultGlobal || props.sessionId === null,
        });
    };
    const startEdit = (note) => {
        setEditing({
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags.join(', '),
            sessionId: note.sessionId ?? null,
        });
    };
    const saveEditor = async () => {
        if (editing === null || saving)
            return;
        const content = editing.content.trim();
        if (content === '')
            return;
        setSaving(true);
        const tags = editing.tags.split(/[,，]/).map((tag) => tag.trim()).filter((tag) => tag !== '');
        // The checkbox "save to global" clears the session binding; otherwise the
        // note is bound to the current session (or stays global when no session).
        const sessionId = editing.global === true ? null : (props.sessionId ?? null);
        try {
            if (editing.id !== undefined) {
                const result = await api.update(editing.id, {
                    title: editing.title.trim(),
                    content,
                    tags,
                    sessionId,
                });
                if (!result.ok) {
                    showToast(result.error);
                    setSaving(false);
                    return;
                }
            }
            else {
                const result = await api.create({
                    title: editing.title.trim() === '' ? undefined : editing.title.trim(),
                    content,
                    tags,
                    source: editing.source,
                    sessionId,
                });
                if (!result.ok) {
                    showToast(result.error);
                    setSaving(false);
                    return;
                }
            }
            setEditing(null);
            setConfirmId(null);
            await load(query, scope);
            showToast(t('notes.item.saved'));
        }
        catch {
            showToast(t('notes.panel.loadFailed'));
        }
        setSaving(false);
    };
    const removeNote = async (id) => {
        try {
            await api.remove(id);
            setConfirmId(null);
            await load(query, scope);
        }
        catch {
            showToast(t('notes.panel.loadFailed'));
        }
    };
    const copyNote = async (note) => {
        const text = note.title === '' ? note.content : `${note.title}\n\n${note.content}`;
        try {
            await navigator.clipboard.writeText(text);
            showToast(t('notes.item.copied'));
        }
        catch {
            showToast(t('notes.item.copyFailed'));
        }
    };
    // Editor view.
    if (editing !== null) {
        return (_jsxs("section", { className: "dshn-panel", "data-dsh-notes-panel": true, children: [_jsxs("header", { className: "dshn-panel-header", children: [_jsx("button", { type: "button", className: "dshn-editor-back", "aria-label": t('notes.editor.cancel'), onClick: () => { setEditing(null); }, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M10 3L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L10 13", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("span", { className: "dshn-editor-title-label", children: editing.id !== undefined ? t('notes.item.edit') : t('notes.panel.new') })] }), _jsxs("div", { className: "dshn-editor", children: [_jsx("input", { className: "dshn-input", type: "text", value: editing.title, placeholder: t('notes.editor.titlePlaceholder'), onChange: (event) => { setEditing({ ...editing, title: event.target.value }); } }), detectMarkdown(editing.content) ? (_jsxs("div", { className: "dshn-md-toggle", role: "group", "aria-label": t('notes.editor.mdMode'), children: [_jsx("button", { type: "button", className: mdMode === 'edit' ? 'dshn-md-btn dshn-md-btn-active' : 'dshn-md-btn', "data-dsh-part": "notes-md-edit", onClick: () => { setMdMode('edit'); }, children: t('notes.editor.mdEdit') }), _jsx("button", { type: "button", className: mdMode === 'preview' ? 'dshn-md-btn dshn-md-btn-active' : 'dshn-md-btn', "data-dsh-part": "notes-md-preview-toggle", onClick: () => { setMdMode('preview'); }, children: t('notes.editor.mdPreview') })] })) : null, mdMode === 'preview' && detectMarkdown(editing.content) ? (_jsx("div", { className: "dshn-md-preview", "data-dsh-part": "notes-md-preview", role: "region", "aria-label": t('notes.editor.mdPreview'), children: _jsx("div", { className: "dshn-md-body", dangerouslySetInnerHTML: { __html: renderMarkdown(editing.content) } }) })) : (_jsx("textarea", { ref: contentRef, className: "dshn-input dshn-textarea", value: editing.content, placeholder: t('notes.editor.contentPlaceholder'), onChange: (event) => { setEditing({ ...editing, content: event.target.value }); }, onKeyDown: (event) => {
                                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                    event.preventDefault();
                                    void saveEditor();
                                }
                            } })), _jsx("input", { className: "dshn-input", type: "text", value: editing.tags, placeholder: t('notes.editor.tagsPlaceholder'), onChange: (event) => { setEditing({ ...editing, tags: event.target.value }); } }), props.sessionId !== null ? (_jsxs("label", { className: "dshn-check-row", children: [_jsx("input", { type: "checkbox", className: "dshn-check", checked: editing.global === true, onChange: (event) => { setEditing({ ...editing, global: event.target.checked }); } }), _jsx("span", { children: t('notes.editor.globalOnly') })] })) : null, _jsxs("div", { className: "dshn-editor-footer", children: [_jsx("button", { type: "button", className: "dshn-btn", onClick: () => { setEditing(null); }, disabled: saving, children: t('notes.editor.cancel') }), _jsx("button", { type: "button", className: "dshn-btn dshn-btn-primary", onClick: () => { void saveEditor(); }, disabled: saving || editing.content.trim() === '', children: saving ? t('notes.editor.saving') : t('notes.editor.save') })] })] }), toast !== null ? _jsx("div", { className: "dshn-toast", role: "status", children: toast }) : null] }));
    }
    // List view.
    const list = notes ?? [];
    return (_jsxs("section", { className: "dshn-panel", "data-dsh-notes-panel": true, children: [_jsxs("header", { className: "dshn-panel-header", children: [_jsx("span", { className: "dshn-panel-title", children: t('notes.panel.title') }), _jsx("span", { className: "dshn-panel-count", children: count }), _jsx("button", { type: "button", className: "dshn-icon-btn", "aria-label": t('notes.panel.title'), onClick: onClose, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M3 3L11 11M11 3L3 11", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }) }) })] }), _jsxs("div", { className: "dshn-toolbar", children: [_jsx("input", { className: "dshn-search", type: "text", value: query, placeholder: t('notes.panel.searchPlaceholder'), onChange: (event) => { onSearch(event.target.value); } }), _jsx("button", { type: "button", className: "dshn-new-btn", onClick: () => { startNew(); }, children: t('notes.panel.new') })] }), props.sessionId !== null ? (_jsx("div", { className: "dshn-scopes", role: "tablist", "aria-label": t('notes.panel.title'), children: ['all', 'session', 'global'].map((item) => (_jsx("button", { type: "button", role: "tab", "aria-selected": scope === item, className: scope === item ? 'dshn-scope dshn-scope-active' : 'dshn-scope', onClick: () => { changeScope(item); }, children: t(item === 'all' ? 'notes.scope.all' : item === 'session' ? 'notes.scope.session' : 'notes.scope.global') }, item))) })) : (_jsx("div", { className: "dshn-scopes dshn-scopes-muted", role: "note", children: t('notes.scope.globalHint') })), error !== null ? (_jsx("div", { className: "dshn-error", role: "status", children: t('notes.panel.loadFailed') })) : notes === null ? (_jsx("div", { className: "dshn-loading", role: "status", children: t('notes.panel.loading') })) : list.length === 0 ? (_jsxs("div", { className: "dshn-empty", children: [_jsxs("svg", { className: "dshn-empty-icon", width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "M6 3.5C6 2.94772 6.44772 2.5 7 2.5H17C17.5523 2.5 18 2.94772 18 3.5V20.5C18 21.0523 17.5523 21.5 17 21.5H7C6.44772 21.5 6 21.0523 6 20.5V3.5Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), _jsx("path", { d: "M9 6.5H15M9 10H15M9 13.5H12", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" })] }), _jsx("span", { children: t('notes.panel.empty') })] })) : (_jsx("div", { className: "dshn-list", children: list.map((note) => {
                    const sourceLabel = note.source === 'selection'
                        ? t('notes.source.selection')
                        : note.source === 'composer' ? t('notes.source.composer') : t('notes.source.manual');
                    const confirmed = confirmId === note.id;
                    return (_jsxs("article", { className: "dshn-item", onClick: () => { if (!confirmed)
                            startEdit(note); }, role: "button", tabIndex: 0, onKeyDown: (event) => {
                            if (event.key === 'Enter' && !confirmed)
                                startEdit(note);
                        }, children: [_jsx("div", { className: "dshn-item-actions", onClick: (event) => event.stopPropagation(), children: confirmed
                                    ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "dshn-action dshn-action-danger", onClick: () => { void removeNote(note.id); }, children: t('notes.confirm.ok') }), _jsx("button", { type: "button", className: "dshn-action", onClick: () => { setConfirmId(null); }, children: t('notes.confirm.cancel') })] }))
                                    : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "dshn-action", title: t('notes.item.insert'), onClick: () => { showToast(onInsert(note)); }, children: t('notes.item.insert') }), _jsx("button", { type: "button", className: "dshn-action", title: t('notes.item.copy'), onClick: () => { void copyNote(note); }, children: t('notes.item.copy') }), _jsx("button", { type: "button", className: "dshn-action", title: t('notes.item.edit'), onClick: () => { startEdit(note); }, children: t('notes.item.edit') }), _jsx("button", { type: "button", className: "dshn-action dshn-action-danger", title: t('notes.item.delete'), onClick: () => { setConfirmId(note.id); }, children: t('notes.item.delete') })] })) }), _jsx("div", { className: "dshn-item-title", children: note.title }), _jsx("div", { className: "dshn-item-preview", children: note.content }), _jsxs("div", { className: "dshn-item-meta", children: [_jsx("span", { className: "dshn-tag dshn-source-tag", children: sourceLabel }), _jsx("span", { className: note.sessionId === undefined ? 'dshn-tag dshn-scope-tag dshn-scope-tag-global' : 'dshn-tag dshn-scope-tag', children: note.sessionId === undefined ? t('notes.item.globalTag') : t('notes.item.sessionTag') }), _jsx("span", { children: relativeTime(note.updatedAt, props.t) })] }), note.tags.length > 0 ? (_jsx("div", { className: "dshn-item-tags", children: note.tags.map((tag) => _jsxs("span", { className: "dshn-tag", children: ["#", tag] }, tag)) })) : null] }, note.id));
                }) })), toast !== null ? _jsx("div", { className: "dshn-toast", role: "status", children: toast }) : null] }));
}
