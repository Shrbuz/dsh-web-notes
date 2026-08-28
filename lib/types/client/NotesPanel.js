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
/** Panel width bounds (px) — draggable resize, persisted per browser. */
const PANEL_WIDTH_MIN = 280;
const PANEL_WIDTH_MAX = 640;
const PANEL_WIDTH_DEFAULT = 400;
const PANEL_WIDTH_STORAGE_KEY = 'dsh-notes.panel-width';
/** Load the persisted panel width; tolerant of corrupt/missing entries. */
function loadPanelWidth() {
    try {
        const raw = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
        if (raw === null)
            return PANEL_WIDTH_DEFAULT;
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
            return Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, parsed));
        }
    }
    catch {
        // localStorage unavailable; the default width applies.
    }
    return PANEL_WIDTH_DEFAULT;
}
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
    // Latest session id + draft, read by the session-switch effect so the
    // auto-save binds to the session being LEFT, not the one being entered.
    const sessionIdRef = useRef(sessionId);
    const editingRef = useRef(null);
    // Panel width (draggable left edge), persisted across reloads.
    const [panelWidth, setPanelWidth] = useState(() => loadPanelWidth());
    const resizeRef = useRef(null);
    /** Begin dragging the panel's left edge to resize it. */
    const onResizeStart = useCallback((event) => {
        if (event.button !== 0)
            return;
        resizeRef.current = { startX: event.clientX, startWidth: panelWidth };
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        catch {
            // Synthetic pointers (tests) have no capture; dragging still works.
        }
    }, [panelWidth]);
    /** Track the pointer while dragging, clamping to the width bounds. */
    const onResizeMove = useCallback((event) => {
        const state = resizeRef.current;
        if (state === null)
            return;
        const next = Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, state.startWidth + (state.startX - event.clientX)));
        setPanelWidth(next);
    }, []);
    /** End the drag and persist the final width. */
    const onResizeEnd = useCallback(() => {
        resizeRef.current = null;
        setPanelWidth((current) => {
            try {
                localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(current));
            }
            catch {
                // localStorage unavailable; the width still applies for this page.
            }
            return current;
        });
    }, []);
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
    /** Persist a draft bound to an explicit target session. The Save button
     *  binds to the current session; a session-switch auto-save binds to the
     *  session being left so the note does not silently jump sessions. */
    const persistDraft = useCallback(async (draft, targetSession) => {
        const content = draft.content.trim();
        if (content === '')
            return false;
        const tags = draft.tags.split(/[,，]/).map((tag) => tag.trim()).filter((tag) => tag !== '');
        // The "save to global" checkbox clears the session binding; otherwise the
        // note binds to the target session (null when none).
        const bindSession = draft.global === true ? null : targetSession;
        try {
            if (draft.id !== undefined) {
                const result = await api.update(draft.id, {
                    title: draft.title.trim(),
                    content,
                    tags,
                    sessionId: bindSession,
                });
                if (!result.ok) {
                    showToast(result.error);
                    return false;
                }
            }
            else {
                const result = await api.create({
                    title: draft.title.trim() === '' ? undefined : draft.title.trim(),
                    content,
                    tags,
                    source: draft.source,
                    sessionId: bindSession,
                });
                if (!result.ok) {
                    showToast(result.error);
                    return false;
                }
            }
            return true;
        }
        catch {
            showToast(t('notes.panel.loadFailed'));
            return false;
        }
    }, [api, showToast, t]);
    // Keep the latest draft in a ref (read by the session-switch effect below).
    useEffect(() => {
        editingRef.current = editing;
    }, [editing]);
    // Session switch while the panel is open: if the editor holds a draft,
    // auto-save it against the session being LEFT, then fall back to the list
    // view. The load effect above (keyed on sessionId) reloads the new session.
    useEffect(() => {
        const prevSession = sessionIdRef.current;
        sessionIdRef.current = sessionId;
        if (prevSession === sessionId)
            return;
        const draft = editingRef.current;
        if (draft !== null) {
            if (draft.content.trim() !== '') {
                void persistDraft(draft, prevSession);
            }
            setEditing(null);
            setConfirmId(null);
            setMdMode('edit');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, persistDraft]);
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
        if (editing.content.trim() === '')
            return;
        setSaving(true);
        const ok = await persistDraft(editing, props.sessionId ?? null);
        if (ok) {
            setEditing(null);
            setConfirmId(null);
            await load(query, scope);
            showToast(t('notes.item.saved'));
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
        return (_jsxs("section", { className: "dshn-panel", "data-dsh-notes-panel": true, style: { '--dshn-panel-width': `${panelWidth}px` }, children: [_jsx("div", { className: "dshn-panel-resize", "data-dsh-part": "notes-panel-resize", "aria-hidden": "true", onPointerDown: onResizeStart, onPointerMove: onResizeMove, onPointerUp: onResizeEnd, onPointerCancel: onResizeEnd }), _jsxs("header", { className: "dshn-panel-header", children: [_jsx("button", { type: "button", className: "dshn-editor-back", "aria-label": t('notes.editor.cancel'), onClick: () => { setEditing(null); }, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M10 3L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L10 13", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("span", { className: "dshn-editor-title-label", children: editing.id !== undefined ? t('notes.item.edit') : t('notes.panel.new') })] }), _jsxs("div", { className: "dshn-editor", children: [_jsx("input", { className: "dshn-input", type: "text", value: editing.title, placeholder: t('notes.editor.titlePlaceholder'), onChange: (event) => { setEditing({ ...editing, title: event.target.value }); } }), detectMarkdown(editing.content) ? (_jsxs("div", { className: "dshn-md-toggle", role: "group", "aria-label": t('notes.editor.mdMode'), children: [_jsx("button", { type: "button", className: mdMode === 'edit' ? 'dshn-md-btn dshn-md-btn-active' : 'dshn-md-btn', "data-dsh-part": "notes-md-edit", onClick: () => { setMdMode('edit'); }, children: t('notes.editor.mdEdit') }), _jsx("button", { type: "button", className: mdMode === 'preview' ? 'dshn-md-btn dshn-md-btn-active' : 'dshn-md-btn', "data-dsh-part": "notes-md-preview-toggle", onClick: () => { setMdMode('preview'); }, children: t('notes.editor.mdPreview') })] })) : null, mdMode === 'preview' && detectMarkdown(editing.content) ? (_jsx("div", { className: "dshn-md-preview", "data-dsh-part": "notes-md-preview", role: "region", "aria-label": t('notes.editor.mdPreview'), children: _jsx("div", { className: "dshn-md-body", dangerouslySetInnerHTML: { __html: renderMarkdown(editing.content) } }) })) : (_jsx("textarea", { ref: contentRef, className: "dshn-input dshn-textarea", value: editing.content, placeholder: t('notes.editor.contentPlaceholder'), onChange: (event) => { setEditing({ ...editing, content: event.target.value }); }, onKeyDown: (event) => {
                                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                    event.preventDefault();
                                    void saveEditor();
                                }
                            } })), _jsx("input", { className: "dshn-input", type: "text", value: editing.tags, placeholder: t('notes.editor.tagsPlaceholder'), onChange: (event) => { setEditing({ ...editing, tags: event.target.value }); } }), props.sessionId !== null ? (_jsxs("label", { className: "dshn-check-row", children: [_jsx("input", { type: "checkbox", className: "dshn-check", checked: editing.global === true, onChange: (event) => { setEditing({ ...editing, global: event.target.checked }); } }), _jsx("span", { children: t('notes.editor.globalOnly') })] })) : null, _jsxs("div", { className: "dshn-editor-footer", children: [_jsx("button", { type: "button", className: "dshn-btn", onClick: () => { setEditing(null); }, disabled: saving, children: t('notes.editor.cancel') }), _jsx("button", { type: "button", className: "dshn-btn dshn-btn-primary", onClick: () => { void saveEditor(); }, disabled: saving || editing.content.trim() === '', children: saving ? t('notes.editor.saving') : t('notes.editor.save') })] })] }), toast !== null ? _jsx("div", { className: "dshn-toast", role: "status", children: toast }) : null] }));
    }
    // List view.
    const list = notes ?? [];
    return (_jsxs("section", { className: "dshn-panel", "data-dsh-notes-panel": true, style: { '--dshn-panel-width': `${panelWidth}px` }, children: [_jsx("div", { className: "dshn-panel-resize", "data-dsh-part": "notes-panel-resize", "aria-hidden": "true", onPointerDown: onResizeStart, onPointerMove: onResizeMove, onPointerUp: onResizeEnd, onPointerCancel: onResizeEnd }), _jsxs("header", { className: "dshn-panel-header", children: [_jsxs("span", { className: "dshn-panel-title", children: [_jsxs("svg", { className: "dshn-panel-title-icon", width: "16", height: "16", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "M5.5 2.8C5.5 2.35817 5.85817 2 6.3 2H13.7C14.1418 2 14.5 2.35817 14.5 2.8V17.2C14.5 17.6418 14.1418 18 13.7 18H6.3C5.85817 18 5.5 17.6418 5.5 17.2V2.8Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), _jsx("path", { d: "M14.5 5.5H16C16.5523 5.5 17 5.94772 17 6.5V15.5C17 16.6046 16.1046 17.5 15 17.5H14.5", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round", opacity: "0.55" }), _jsx("path", { d: "M7.8 6H12.2M7.8 9H12.2M7.8 12H10.5", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })] }), t('notes.panel.title')] }), _jsx("span", { className: "dshn-panel-count", children: count }), _jsx("button", { type: "button", className: "dshn-icon-btn", "aria-label": t('notes.panel.title'), onClick: onClose, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M3 3L11 11M11 3L3 11", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }) }) })] }), _jsxs("div", { className: "dshn-toolbar", children: [_jsx("input", { className: "dshn-search", type: "text", value: query, placeholder: t('notes.panel.searchPlaceholder'), onChange: (event) => { onSearch(event.target.value); } }), _jsx("button", { type: "button", className: "dshn-new-btn", onClick: () => { startNew(); }, children: t('notes.panel.new') })] }), props.sessionId !== null ? (_jsx("div", { className: "dshn-scopes", role: "tablist", "aria-label": t('notes.panel.title'), children: ['all', 'session', 'global'].map((item) => (_jsx("button", { type: "button", role: "tab", "aria-selected": scope === item, className: scope === item ? 'dshn-scope dshn-scope-active' : 'dshn-scope', onClick: () => { changeScope(item); }, children: t(item === 'all' ? 'notes.scope.all' : item === 'session' ? 'notes.scope.session' : 'notes.scope.global') }, item))) })) : (_jsx("div", { className: "dshn-scopes dshn-scopes-muted", role: "note", children: t('notes.scope.globalHint') })), error !== null ? (_jsx("div", { className: "dshn-error", role: "status", children: t('notes.panel.loadFailed') })) : notes === null ? (_jsx("div", { className: "dshn-loading", role: "status", children: t('notes.panel.loading') })) : list.length === 0 ? (_jsxs("div", { className: "dshn-empty", children: [_jsx("div", { className: "dshn-empty-art", "aria-hidden": "true", children: _jsxs("svg", { width: "88", height: "88", viewBox: "0 0 96 96", fill: "none", children: [_jsx("path", { d: "M30 14C30 11.7909 31.7909 10 34 10H66C68.2091 10 70 11.7909 70 14V82C70 84.2091 68.2091 86 66 86H34C31.7909 86 30 84.2091 30 82V14Z", stroke: "var(--dshn-neutral-500)", strokeWidth: "1.8", strokeLinejoin: "round", opacity: "0.6" }), _jsx("path", { d: "M22 20C22 17.7909 23.7909 16 26 16H62C64.2091 16 66 17.7909 66 20V88C66 90.2091 64.2091 92 62 92H26C23.7909 92 22 90.2091 22 88V20Z", fill: "var(--dshn-bg-overlay)", stroke: "var(--dshn-neutral-600)", strokeWidth: "1.8", strokeLinejoin: "round" }), _jsx("path", { d: "M30 30H58M30 38H58M30 46H50", stroke: "var(--dshn-neutral-500)", strokeWidth: "2.2", strokeLinecap: "round", opacity: "0.7" }), _jsx("path", { d: "M30 56H54M30 64H54", stroke: "var(--dshn-neutral-500)", strokeWidth: "2.2", strokeLinecap: "round", opacity: "0.45" }), _jsx("path", { d: "M76 26L78 32L84 34L78 36L76 42L74 36L68 34L74 32L76 26Z", fill: "var(--dshn-primary)", opacity: "0.85" }), _jsx("circle", { cx: "70", cy: "60", r: "3", fill: "var(--dshn-primary)", opacity: "0.5" }), _jsx("circle", { cx: "80", cy: "72", r: "2", fill: "var(--dshn-primary)", opacity: "0.35" })] }) }), _jsx("div", { className: "dshn-empty-title", children: t('notes.panel.emptyTitle') }), _jsx("div", { className: "dshn-empty-hint", children: t('notes.panel.empty') }), _jsxs("button", { type: "button", className: "dshn-empty-new", onClick: () => { startNew(); }, children: [_jsx("svg", { width: "13", height: "13", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M7 2.5V11.5M2.5 7H11.5", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }) }), t('notes.panel.new')] })] })) : (_jsx("div", { className: "dshn-list", children: list.map((note) => {
                    const sourceLabel = note.source === 'selection'
                        ? t('notes.source.selection')
                        : note.source === 'composer' ? t('notes.source.composer') : t('notes.source.manual');
                    const confirmed = confirmId === note.id;
                    return (_jsxs("article", { className: `dshn-item${note.sessionId === undefined ? ' dshn-item-global' : ' dshn-item-session'}`, "data-source": note.source ?? 'manual', onClick: () => { if (!confirmed)
                            startEdit(note); }, role: "button", tabIndex: 0, onKeyDown: (event) => {
                            if (event.key === 'Enter' && !confirmed)
                                startEdit(note);
                        }, children: [_jsx("div", { className: "dshn-item-actions", onClick: (event) => event.stopPropagation(), children: confirmed
                                    ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "dshn-action dshn-action-danger", onClick: () => { void removeNote(note.id); }, children: t('notes.confirm.ok') }), _jsx("button", { type: "button", className: "dshn-action", onClick: () => { setConfirmId(null); }, children: t('notes.confirm.cancel') })] }))
                                    : (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "dshn-action", title: t('notes.item.insert'), onClick: () => { showToast(onInsert(note)); }, children: [_jsx("svg", { width: "12", height: "12", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M3.5 7H10.5M10.5 7L8 4.5M10.5 7L8 9.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }), t('notes.item.insert')] }), _jsxs("button", { type: "button", className: "dshn-action", title: t('notes.item.copy'), onClick: () => { void copyNote(note); }, children: [_jsx("svg", { width: "12", height: "12", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M4.5 4.5H3.5C3.22386 4.5 3 4.72386 3 5V11.5C3 11.7761 3.22386 12 3.5 12H9C9.27614 12 9.5 11.7761 9.5 11.5V10.5M4.5 4.5H10.5C10.7761 4.5 11 4.72386 11 5V10.5M4.5 4.5V10.5C4.5 10.7761 4.72386 11 5 11H10.5", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }), t('notes.item.copy')] }), _jsxs("button", { type: "button", className: "dshn-action", title: t('notes.item.edit'), onClick: () => { startEdit(note); }, children: [_jsx("svg", { width: "12", height: "12", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M8.5 3L11 5.5M2.5 11.5L5.2 10.8L11.5 4.5C11.8 4.2 11.8 3.7 11.5 3.4L10.6 2.5C10.3 2.2 9.8 2.2 9.5 2.5L3.2 8.8L2.5 11.5Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }), t('notes.item.edit')] }), _jsxs("button", { type: "button", className: "dshn-action dshn-action-danger", title: t('notes.item.delete'), onClick: () => { setConfirmId(note.id); }, children: [_jsx("svg", { width: "12", height: "12", viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M2.5 4H11.5M5.5 4V2.8C5.5 2.63431 5.63431 2.5 5.8 2.5H8.2C8.36569 2.5 8.5 2.63431 8.5 2.8V4M3.5 4L4.2 11.2C4.22286 11.4869 4.45858 11.7 4.746 11.7H9.254C9.54142 11.7 9.77714 11.4869 9.8 11.2L10.5 4M5.8 6V9.7M8.2 6V9.7", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }) }), t('notes.item.delete')] })] })) }), _jsx("div", { className: "dshn-item-title", children: note.title }), _jsx("div", { className: "dshn-item-preview", children: note.content }), _jsxs("div", { className: "dshn-item-meta", children: [_jsx("span", { className: "dshn-tag dshn-source-tag", children: sourceLabel }), _jsx("span", { className: note.sessionId === undefined ? 'dshn-tag dshn-scope-tag dshn-scope-tag-global' : 'dshn-tag dshn-scope-tag', children: note.sessionId === undefined ? t('notes.item.globalTag') : t('notes.item.sessionTag') }), _jsx("span", { className: "dshn-item-time", children: relativeTime(note.updatedAt, props.t) })] }), note.tags.length > 0 ? (_jsx("div", { className: "dshn-item-tags", children: note.tags.map((tag) => _jsxs("span", { className: "dshn-tag", children: ["#", tag] }, tag)) })) : null] }, note.id));
                }) })), _jsxs("div", { className: "dshn-footer", children: [_jsx("span", { className: "dshn-footer-text", children: t('notes.footer.star') }), _jsxs("span", { className: "dshn-footer-links", children: [_jsx("a", { className: "dshn-footer-link", href: "https://github.com/Shrbuz/dsh-web-notes", target: "_blank", rel: "noopener noreferrer", children: t('notes.footer.github') }), _jsx("a", { className: "dshn-footer-link", href: "https://cnb.cool/wfhmkj2021/chenqiangyong/dsh-web-notes", target: "_blank", rel: "noopener noreferrer", children: t('notes.footer.cnb') })] })] }), toast !== null ? _jsx("div", { className: "dshn-toast", role: "status", children: toast }) : null] }));
}
