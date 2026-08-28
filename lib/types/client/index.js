/**
 * dsh-web-notes browser half — mounts the floating note dock + panel directly
 * onto document.body (a global surface, host-global like the pet: notes have
 * no session dimension, and a session-scoped slot would vanish on the
 * new-conversation screen). It talks to the host through the same-origin
 * /api/notes/* JSON endpoints and drives the composer through the official
 * conversation input facade.
 *
 * Insert semantics: with an open session the note text lands in that
 * session's composer draft (appended after any existing draft) — the user
 * reviews and sends it; without an open session the text falls back to the
 * clipboard.
 * @module dsh-web-notes/client
 */
import { createNotesApi } from "./api.js";
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { NotesDock } from "./NotesDock.js";
import { summarizeForInsert } from "./NotesDock.js";
import { NotesSettingsCard } from "./NotesSettingsCard.js";
import { notesSettingsSpec } from "./settings.js";
import { t } from "./locales.js";
import { NOTES_CSS } from "./styles.js";
/** Required services (sessions + conversation power insert-into-composer; the
 * settings scope + slots drive the plugin card in 设置 → 插件 → 插件配置). */
export const inject = ['sessions', 'conversation', 'slots', 'settingsScope', 'inputTriggers'];
/**
 * Insert raw text into the current session's composer draft; falls back to
 * the clipboard when no session is open or the input facade is unreachable.
 * @param ctx - client root context.
 * @param text - the text to insert.
 * @returns a toast copy describing what happened.
 */
function insertTextIntoComposer(ctx, text) {
    const list = ctx.sessions.list.getSnapshot();
    const current = list.current;
    if (current !== undefined) {
        const actx = ctx.sessions.scope(current);
        if (actx !== undefined) {
            try {
                const input = ctx.conversation.input.for(actx);
                const snapshot = input.state.getSnapshot();
                const draft = snapshot.draft ?? '';
                input.setDraft(draft.trim() === '' ? text : draft + '\n\n' + text);
                return t('notes.selection.inserted');
            }
            catch {
                // Fall through to the clipboard path.
            }
        }
    }
    // Clipboard fallback (defensive: the Clipboard API may be absent in
    // sandboxed/headless environments — never throw from the insert action).
    const clipboard = navigator.clipboard;
    if (clipboard !== undefined) {
        void clipboard.writeText(text).then(() => {
            // Swallow success; the toast below already reports the fallback.
        }, () => {
            // Ignore clipboard failures; the toast reports the fallback regardless.
        });
    }
    return t('notes.item.noSession');
}
/** Trigger source name for the insert-to-conversation reference chip. */
export const QUOTE_SOURCE = 'notes-quote';
/**
 * Register the `@`-trigger reference source that powers the
 * insert-to-conversation chip. Selecting text and clicking "引入到对话" stores
 * the FULL text here (keyed by a fresh ref id) and mints the chip directly via
 * `input.insertReference` (no menu interaction): the chip label is the
 * head…tail summary, and on submit the codec expands the ref back to the
 * complete text the model reads.
 * @param ctx - client root context (must carry `inputTriggers`).
 */
export function registerQuoteSource(ctx) {
    // Pending full texts, keyed by ref id until the chip is minted (and later
    // serialized). Survives the source callbacks' lifetime.
    const pending = new Map();
    let seq = 0;
    const inputTriggers = ctx.get('inputTriggers');
    const source = {
        trigger: '@',
        name: QUOTE_SOURCE,
        showGroupTitle: false,
        async candidates() {
            return [];
        },
        onPick() {
            return undefined;
        },
        codec: {
            clipboardText: (ref) => summarizeForInsert(pending.get(ref) ?? ref),
            serialize: async (ref) => {
                const text = pending.get(ref);
                if (text === undefined)
                    return ref;
                return text;
            },
        },
    };
    const unregister = inputTriggers.registerSource(source);
    /** Mint the chip directly in the composer: store the full text, then call
     *  `input.insertReference` with a span at the end of the current draft so
     *  the machine creates the occurrence (the chip shows the summary; submit
     *  expands it via the source codec to the full text). */
    const insertText = (text) => {
        const trimmed = text.trim();
        if (trimmed === '')
            return '';
        const list = ctx.sessions.list.getSnapshot();
        const current = list.current;
        if (current === undefined) {
            // No session: fall back to clipboard (same as plain insert).
            const clipboard = navigator.clipboard;
            if (clipboard !== undefined)
                void clipboard.writeText(trimmed);
            return t('notes.item.noSession');
        }
        const actx = ctx.sessions.scope(current);
        if (actx === undefined)
            return t('notes.item.noSession');
        try {
            const input = ctx.conversation.input.for(actx);
            const snapshot = input.state.getSnapshot();
            const draft = snapshot.draft ?? '';
            const start = draft.length;
            pending.clear();
            const ref = `quote-${++seq}`;
            pending.set(ref, trimmed);
            const accepted = input.insertReference({
                source: QUOTE_SOURCE,
                ref,
                label: summarizeForInsert(trimmed),
                appearance: 'file',
                clipboardText: summarizeForInsert(trimmed),
            }, {
                start,
                end: start,
                draftRev: snapshot.draftRev,
            });
            if (!accepted) {
                // The machine refused (phase/span guard): fall back to clipboard.
                const clipboard = navigator.clipboard;
                if (clipboard !== undefined)
                    void clipboard.writeText(trimmed);
                return t('notes.item.noSession');
            }
            return t('notes.selection.inserted');
        }
        catch {
            // Fall back to clipboard on any trigger failure.
            const clipboard = navigator.clipboard;
            if (clipboard !== undefined)
                void clipboard.writeText(trimmed);
            return t('notes.item.noSession');
        }
    };
    // Tie disposal to the plugin effect lifecycle.
    return { insertText, dispose: unregister };
}
/**
 * Insert a note into the current session's composer draft.
 * Only the note CONTENT is inserted — the title is a list label, not chat
 * payload, and would only add noise to the draft.
 * @param ctx - client root context.
 * @param note - the note to insert.
 * @returns a toast copy describing what happened.
 */
function insertIntoComposer(ctx, note) {
    return insertTextIntoComposer(ctx, note.content);
}
/**
 * Client plugin body: inject the styles, read the host switches, and mount
 * the floating notes dock for the page lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    // Styles are injected by the module loader's style-tag discipline. The
    // tag's data-plugin MUST equal the loader module id (dsh-web-notes) or the
    // loader cannot claim the styles for unload cleanup.
    const styleTag = document.createElement('style');
    styleTag.dataset.plugin = 'dsh-web-notes';
    styleTag.dataset.pluginCss = 'dsh-web-notes/styles';
    styleTag.textContent = NOTES_CSS;
    document.head.appendChild(styleTag);
    let styleRemoved = false;
    ctx.effect(() => () => {
        if (styleRemoved)
            return;
        styleRemoved = true;
        styleTag.remove();
    }, 'notes: styles');
    const api = createNotesApi();
    // Insert-to-conversation reference chip: registers the `@`-trigger source
    // and returns the programmatic insert that stores the full text and mints
    // a summary chip in the composer (the model reads the full text on send).
    const quote = registerQuoteSource(ctx);
    ctx.effect(() => () => {
        quote.dispose?.();
    }, 'notes: quote source');
    // The `notes` settings scope mirrors the Host section; the dock reads its UI
    // preferences live and the settings card writes back through it.
    const settingsScope = ctx.settingsScope.bind(notesSettingsSpec);
    // Plugin configuration card (设置 → 插件 → 插件配置). Registered only while
    // the settings section exists; the slot owner dispatches it by the `notes`
    // namespace key.
    ctx.effect(() => ctx.slots.inject('settings.plugin.item', function* () {
        yield ctx.slots.register({
            name: 'settings.plugin.item',
            key: 'notes',
            inject: () => ({ scope: settingsScope, notesT: t }),
        }, NotesSettingsCard);
    }), 'notes: settings card');
    // Host switches gate the whole UI: when disabled the dock never mounts;
    // selectionCapture toggles only the capture bubble.
    let mounted = false;
    let root;
    let container;
    const mount = (capture) => {
        if (mounted)
            return;
        mounted = true;
        container = document.createElement('div');
        container.dataset.dshNotesRoot = '';
        container.dataset.dshPlugin = 'notes';
        document.body.appendChild(container);
        root = createRoot(container);
        root.render(createElement(NotesDock, {
            api,
            t,
            sessions: ctx.sessions,
            settingsScope,
            selectionCapture: capture,
            onInsert: (note) => insertIntoComposer(ctx, note),
            onInsertText: (text) => quote.insertText(text),
        }));
    };
    const syncEnabled = () => {
        if (mounted)
            return;
        api.state().then((state) => {
            if (mounted)
                return;
            if (!state.enabled)
                return;
            mount(state.selectionCapture);
        }, () => {
            // Transport failure: assume enabled so the UI still tries (the API
            // surface will surface per-call errors).
            if (!mounted)
                mount(true);
        });
    };
    ctx.effect(() => {
        syncEnabled();
        return () => {
            if (root !== undefined) {
                root.unmount();
                root = undefined;
            }
            if (container !== undefined && container.parentNode === document.body) {
                container.remove();
                container = undefined;
            }
            mounted = false;
        };
    }, 'notes: ui');
}
