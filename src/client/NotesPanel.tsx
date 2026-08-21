/**
 * Notes panel — the slide-over surface listing every note, searching them,
 * and editing/creating notes. Insert/copy actions live on each list item.
 * @module dsh-web-notes/client/NotesPanel
 */

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import type { NotesApi, NoteView } from './api.ts'
import { relativeTime, type NoteKey } from './locales.ts'
import { detectMarkdown, renderMarkdown } from './markdown.ts'

/** One staged editor draft. */
export interface NoteDraft {
  /** Present when editing an existing note. */
  id?: string
  title: string
  content: string
  tags: string
  /** Capture origin for a brand-new note. */
  source?: 'manual' | 'selection' | 'composer'
  /** Session binding for a brand-new note (null = global). */
  sessionId?: string | null
  /** Editor checkbox: save to global (clear the session binding). */
  global?: boolean
}

/** Scope tabs the panel offers while a session is current. */
export type NoteScope = 'all' | 'session' | 'global'

/** Props of the notes panel. */
export interface NotesPanelProps {
  api: NotesApi
  t: (key: string, params?: Record<string, unknown>) => string
  /** The current session context; null on the new-conversation screen. */
  sessionId: string | null
  /** New notes default to global (settings preference). */
  defaultGlobal: boolean
  /** Insert one note into the composer (or copy it when no session is open). Returns a toast copy. */
  onInsert: (note: NoteView) => string
  /** Close the panel. */
  onClose: () => void
  /** Refresh the dock badge after any note count change. */
  onChanged?: (count: number) => void
  /** A draft to open the editor with (selection saves land here). */
  seed?: NoteDraft | null
  /** Called after the seed draft has been consumed. */
  onSeedConsumed?: () => void
}

const SEARCH_DEBOUNCE_MS = 300

/** The notes panel. */
export function NotesPanel(props: NotesPanelProps): ReactElement {
  const { api, t, onInsert, onClose, onChanged, seed, onSeedConsumed } = props
  const sessionId = props.sessionId
  const [notes, setNotes] = useState<NoteView[] | null>(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<NoteScope>(sessionId === null ? 'global' : 'all')
  const [editing, setEditing] = useState<NoteDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [mdMode, setMdMode] = useState<'edit' | 'preview'>('edit')
  const searchTimer = useRef<number | undefined>(undefined)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)

  const showToast = useCallback((text: string): void => {
    setToast(text)
    window.setTimeout(() => {
      setToast((current) => (current === text ? null : current))
    }, 2200)
  }, [])

  const load = useCallback(async (q: string, activeScope: NoteScope): Promise<void> => {
    try {
      const result = await api.list(q, {
        session: props.sessionId,
        scope: activeScope,
      })
      setNotes(result.notes)
      setCount(result.count)
      setError(null)
      onChanged?.(result.count)
    } catch {
      setError('load-failed')
    }
  }, [api, props.sessionId, onChanged])

  // Initial load + refresh whenever the panel reopens or the context changes.
  useEffect(() => {
    void load(query, scope)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, sessionId])

  // Seed: the dock asks the panel to open the editor with a prefilled draft.
  useEffect(() => {
    if (seed === undefined || seed === null) return
    setEditing({
      ...seed,
      // A seed without an explicit global flag follows the context: without a
      // session everything is global anyway.
      global: seed.global ?? props.sessionId === null,
    })
    setQuery('')
    onSeedConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  // Debounced search.
  const onSearch = (text: string): void => {
    setQuery(text)
    if (searchTimer.current !== undefined) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      void load(text.trim(), scope)
    }, SEARCH_DEBOUNCE_MS)
  }

  const changeScope = (next: NoteScope): void => {
    setScope(next)
    void load(query, next)
  }

  useEffect(() => () => {
    if (searchTimer.current !== undefined) window.clearTimeout(searchTimer.current)
  }, [])

  // Focus the content area when the editor opens.
  useEffect(() => {
    if (editing !== null) {
      window.setTimeout(() => { contentRef.current?.focus() }, 30)
    }
  }, [editing])

  const startNew = (source: NoteDraft['source'] = 'manual'): void => {
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
    })
  }

  const startEdit = (note: NoteView): void => {
    setEditing({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
      sessionId: note.sessionId ?? null,
    })
  }

  const saveEditor = async (): Promise<void> => {
    if (editing === null || saving) return
    const content = editing.content.trim()
    if (content === '') return
    setSaving(true)
    const tags = editing.tags.split(/[,，]/).map((tag) => tag.trim()).filter((tag) => tag !== '')
    // The checkbox "save to global" clears the session binding; otherwise the
    // note is bound to the current session (or stays global when no session).
    const sessionId = editing.global === true ? null : (props.sessionId ?? null)
    try {
      if (editing.id !== undefined) {
        const result = await api.update(editing.id, {
          title: editing.title.trim(),
          content,
          tags,
          sessionId,
        })
        if (!result.ok) {
          showToast(result.error)
          setSaving(false)
          return
        }
      } else {
        const result = await api.create({
          title: editing.title.trim() === '' ? undefined : editing.title.trim(),
          content,
          tags,
          source: editing.source,
          sessionId,
        })
        if (!result.ok) {
          showToast(result.error)
          setSaving(false)
          return
        }
      }
      setEditing(null)
      setConfirmId(null)
      await load(query, scope)
      showToast(t('notes.item.saved'))
    } catch {
      showToast(t('notes.panel.loadFailed'))
    }
    setSaving(false)
  }

  const removeNote = async (id: string): Promise<void> => {
    try {
      await api.remove(id)
      setConfirmId(null)
      await load(query, scope)
    } catch {
      showToast(t('notes.panel.loadFailed'))
    }
  }

  const copyNote = async (note: NoteView): Promise<void> => {
    const text = note.title === '' ? note.content : `${note.title}\n\n${note.content}`
    try {
      await navigator.clipboard.writeText(text)
      showToast(t('notes.item.copied'))
    } catch {
      showToast(t('notes.item.copyFailed'))
    }
  }

  // Editor view.
  if (editing !== null) {
    return (
      <section className="dshn-panel" data-dsh-notes-panel>
        <header className="dshn-panel-header">
          <button
            type="button"
            className="dshn-editor-back"
            aria-label={t('notes.editor.cancel')}
            onClick={() => { setEditing(null) }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="dshn-editor-title-label">
            {editing.id !== undefined ? t('notes.item.edit') : t('notes.panel.new')}
          </span>
        </header>
        <div className="dshn-editor">
          <input
            className="dshn-input"
            type="text"
            value={editing.title}
            placeholder={t('notes.editor.titlePlaceholder')}
            onChange={(event) => { setEditing({ ...editing, title: event.target.value }) }}
          />
          {/* Markdown auto-detect: only when the draft looks like MD does the
              preview/edit toggle appear; plain notes keep the plain editor. */}
          {detectMarkdown(editing.content) ? (
            <div className="dshn-md-toggle" role="group" aria-label={t('notes.editor.mdMode')}>
              <button
                type="button"
                className={mdMode === 'edit' ? 'dshn-md-btn dshn-md-btn-active' : 'dshn-md-btn'}
                data-dsh-part="notes-md-edit"
                onClick={() => { setMdMode('edit') }}
              >
                {t('notes.editor.mdEdit')}
              </button>
              <button
                type="button"
                className={mdMode === 'preview' ? 'dshn-md-btn dshn-md-btn-active' : 'dshn-md-btn'}
                data-dsh-part="notes-md-preview-toggle"
                onClick={() => { setMdMode('preview') }}
              >
                {t('notes.editor.mdPreview')}
              </button>
            </div>
          ) : null}
          {mdMode === 'preview' && detectMarkdown(editing.content) ? (
            <div
              className="dshn-md-preview"
              data-dsh-part="notes-md-preview"
              role="region"
              aria-label={t('notes.editor.mdPreview')}
            >
              <div
                className="dshn-md-body"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(editing.content) }}
              />
            </div>
          ) : (
            <textarea
              ref={contentRef}
              className="dshn-input dshn-textarea"
              value={editing.content}
              placeholder={t('notes.editor.contentPlaceholder')}
              onChange={(event) => { setEditing({ ...editing, content: event.target.value }) }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault()
                  void saveEditor()
                }
              }}
            />
          )}
          <input
            className="dshn-input"
            type="text"
            value={editing.tags}
            placeholder={t('notes.editor.tagsPlaceholder')}
            onChange={(event) => { setEditing({ ...editing, tags: event.target.value }) }}
          />
          {props.sessionId !== null ? (
            <label className="dshn-check-row">
              <input
                type="checkbox"
                className="dshn-check"
                checked={editing.global === true}
                onChange={(event) => { setEditing({ ...editing, global: event.target.checked }) }}
              />
              <span>{t('notes.editor.globalOnly')}</span>
            </label>
          ) : null}
          <div className="dshn-editor-footer">
            <button
              type="button"
              className="dshn-btn"
              onClick={() => { setEditing(null) }}
              disabled={saving}
            >
              {t('notes.editor.cancel')}
            </button>
            <button
              type="button"
              className="dshn-btn dshn-btn-primary"
              onClick={() => { void saveEditor() }}
              disabled={saving || editing.content.trim() === ''}
            >
              {saving ? t('notes.editor.saving') : t('notes.editor.save')}
            </button>
          </div>
        </div>
        {toast !== null ? <div className="dshn-toast" role="status">{toast}</div> : null}
      </section>
    )
  }

  // List view.
  const list = notes ?? []
  return (
    <section className="dshn-panel" data-dsh-notes-panel>
      <header className="dshn-panel-header">
        <span className="dshn-panel-title">
          <svg className="dshn-panel-title-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5.5 2.8C5.5 2.35817 5.85817 2 6.3 2H13.7C14.1418 2 14.5 2.35817 14.5 2.8V17.2C14.5 17.6418 14.1418 18 13.7 18H6.3C5.85817 18 5.5 17.6418 5.5 17.2V2.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M14.5 5.5H16C16.5523 5.5 17 5.94772 17 6.5V15.5C17 16.6046 16.1046 17.5 15 17.5H14.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.55" />
            <path d="M7.8 6H12.2M7.8 9H12.2M7.8 12H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {t('notes.panel.title')}
        </span>
        <span className="dshn-panel-count">{count}</span>
        <button
          type="button"
          className="dshn-icon-btn"
          aria-label={t('notes.panel.title')}
          onClick={onClose}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <div className="dshn-toolbar">
        <input
          className="dshn-search"
          type="text"
          value={query}
          placeholder={t('notes.panel.searchPlaceholder')}
          onChange={(event) => { onSearch(event.target.value) }}
        />
        <button
          type="button"
          className="dshn-new-btn"
          onClick={() => { startNew() }}
        >
          {t('notes.panel.new')}
        </button>
      </div>
      {props.sessionId !== null ? (
        <div className="dshn-scopes" role="tablist" aria-label={t('notes.panel.title')}>
          {(['all', 'session', 'global'] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={scope === item}
              className={scope === item ? 'dshn-scope dshn-scope-active' : 'dshn-scope'}
              onClick={() => { changeScope(item) }}
            >
              {t(item === 'all' ? 'notes.scope.all' : item === 'session' ? 'notes.scope.session' : 'notes.scope.global')}
            </button>
          ))}
        </div>
      ) : (
        <div className="dshn-scopes dshn-scopes-muted" role="note">{t('notes.scope.globalHint')}</div>
      )}

      {error !== null ? (
        <div className="dshn-error" role="status">{t('notes.panel.loadFailed')}</div>
      ) : notes === null ? (
        <div className="dshn-loading" role="status">{t('notes.panel.loading')}</div>
      ) : list.length === 0 ? (
        <div className="dshn-empty">
          <div className="dshn-empty-art" aria-hidden="true">
            <svg width="88" height="88" viewBox="0 0 96 96" fill="none">
              {/* notebook pages — official neutral bluish tones */}
              <path d="M30 14C30 11.7909 31.7909 10 34 10H66C68.2091 10 70 11.7909 70 14V82C70 84.2091 68.2091 86 66 86H34C31.7909 86 30 84.2091 30 82V14Z" stroke="var(--dshn-neutral-500)" strokeWidth="1.8" strokeLinejoin="round" opacity="0.6" />
              <path d="M22 20C22 17.7909 23.7909 16 26 16H62C64.2091 16 66 17.7909 66 20V88C66 90.2091 64.2091 92 62 92H26C23.7909 92 22 90.2091 22 88V20Z" fill="var(--dshn-bg-overlay)" stroke="var(--dshn-neutral-600)" strokeWidth="1.8" strokeLinejoin="round" />
              {/* lines on front page */}
              <path d="M30 30H58M30 38H58M30 46H50" stroke="var(--dshn-neutral-500)" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
              <path d="M30 56H54M30 64H54" stroke="var(--dshn-neutral-500)" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
              {/* sparkle — official business blue accent */}
              <path d="M76 26L78 32L84 34L78 36L76 42L74 36L68 34L74 32L76 26Z" fill="var(--dshn-primary)" opacity="0.85" />
              <circle cx="70" cy="60" r="3" fill="var(--dshn-primary)" opacity="0.5" />
              <circle cx="80" cy="72" r="2" fill="var(--dshn-primary)" opacity="0.35" />
            </svg>
          </div>
          <div className="dshn-empty-title">{t('notes.panel.emptyTitle')}</div>
          <div className="dshn-empty-hint">{t('notes.panel.empty')}</div>
          <button type="button" className="dshn-empty-new" onClick={() => { startNew() }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {t('notes.panel.new')}
          </button>
        </div>
      ) : (
        <div className="dshn-list">
          {list.map((note) => {
            const sourceLabel = note.source === 'selection'
              ? t('notes.source.selection')
              : note.source === 'composer' ? t('notes.source.composer') : t('notes.source.manual')
            const confirmed = confirmId === note.id
            return (
              <article
                key={note.id}
                className={`dshn-item${note.sessionId === undefined ? ' dshn-item-global' : ' dshn-item-session'}`}
                data-source={note.source ?? 'manual'}
                onClick={() => { if (!confirmed) startEdit(note) }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !confirmed) startEdit(note)
                }}
              >
                <div className="dshn-item-actions" onClick={(event) => event.stopPropagation()}>
                  {confirmed
                    ? (
                      <>
                        <button type="button" className="dshn-action dshn-action-danger" onClick={() => { void removeNote(note.id) }}>
                          {t('notes.confirm.ok')}
                        </button>
                        <button type="button" className="dshn-action" onClick={() => { setConfirmId(null) }}>
                          {t('notes.confirm.cancel')}
                        </button>
                      </>
                    )
                    : (
                      <>
                        <button type="button" className="dshn-action" title={t('notes.item.insert')} onClick={() => { showToast(onInsert(note)) }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M3.5 7H10.5M10.5 7L8 4.5M10.5 7L8 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {t('notes.item.insert')}
                        </button>
                        <button type="button" className="dshn-action" title={t('notes.item.copy')} onClick={() => { void copyNote(note) }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M4.5 4.5H3.5C3.22386 4.5 3 4.72386 3 5V11.5C3 11.7761 3.22386 12 3.5 12H9C9.27614 12 9.5 11.7761 9.5 11.5V10.5M4.5 4.5H10.5C10.7761 4.5 11 4.72386 11 5V10.5M4.5 4.5V10.5C4.5 10.7761 4.72386 11 5 11H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {t('notes.item.copy')}
                        </button>
                        <button type="button" className="dshn-action" title={t('notes.item.edit')} onClick={() => { startEdit(note) }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M8.5 3L11 5.5M2.5 11.5L5.2 10.8L11.5 4.5C11.8 4.2 11.8 3.7 11.5 3.4L10.6 2.5C10.3 2.2 9.8 2.2 9.5 2.5L3.2 8.8L2.5 11.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {t('notes.item.edit')}
                        </button>
                        <button type="button" className="dshn-action dshn-action-danger" title={t('notes.item.delete')} onClick={() => { setConfirmId(note.id) }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M2.5 4H11.5M5.5 4V2.8C5.5 2.63431 5.63431 2.5 5.8 2.5H8.2C8.36569 2.5 8.5 2.63431 8.5 2.8V4M3.5 4L4.2 11.2C4.22286 11.4869 4.45858 11.7 4.746 11.7H9.254C9.54142 11.7 9.77714 11.4869 9.8 11.2L10.5 4M5.8 6V9.7M8.2 6V9.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {t('notes.item.delete')}
                        </button>
                      </>
                    )}
                </div>
                <div className="dshn-item-title">{note.title}</div>
                <div className="dshn-item-preview">{note.content}</div>
                <div className="dshn-item-meta">
                  <span className="dshn-tag dshn-source-tag">{sourceLabel}</span>
                  <span className={note.sessionId === undefined ? 'dshn-tag dshn-scope-tag dshn-scope-tag-global' : 'dshn-tag dshn-scope-tag'}>
                    {note.sessionId === undefined ? t('notes.item.globalTag') : t('notes.item.sessionTag')}
                  </span>
                  <span className="dshn-item-time">{relativeTime(note.updatedAt, props.t)}</span>
                </div>
                {note.tags.length > 0 ? (
                  <div className="dshn-item-tags">
                    {note.tags.map((tag) => <span key={tag} className="dshn-tag">#{tag}</span>)}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
      <div className="dshn-footer">
        <span className="dshn-footer-text">{t('notes.footer.star')}</span>
        <span className="dshn-footer-links">
          <a
            className="dshn-footer-link"
            href="https://github.com/Shrbuz/dsh-web-notes"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('notes.footer.github')}
          </a>
          <a
            className="dshn-footer-link"
            href="https://cnb.cool/wfhmkj2021/chenqiangyong/dsh-web-notes"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('notes.footer.cnb')}
          </a>
        </span>
      </div>
      {toast !== null ? <div className="dshn-toast" role="status">{toast}</div> : null}
    </section>
  )
}

/** Re-export for consumers that type against the injected face. */
export type { NoteKey }
