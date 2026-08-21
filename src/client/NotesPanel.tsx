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
        <span className="dshn-panel-title">{t('notes.panel.title')}</span>
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
          <svg className="dshn-empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 3.5C6 2.94772 6.44772 2.5 7 2.5H17C17.5523 2.5 18 2.94772 18 3.5V20.5C18 21.0523 17.5523 21.5 17 21.5H7C6.44772 21.5 6 21.0523 6 20.5V3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M9 6.5H15M9 10H15M9 13.5H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>{t('notes.panel.empty')}</span>
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
                className="dshn-item"
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
                          {t('notes.item.insert')}
                        </button>
                        <button type="button" className="dshn-action" title={t('notes.item.copy')} onClick={() => { void copyNote(note) }}>
                          {t('notes.item.copy')}
                        </button>
                        <button type="button" className="dshn-action" title={t('notes.item.edit')} onClick={() => { startEdit(note) }}>
                          {t('notes.item.edit')}
                        </button>
                        <button type="button" className="dshn-action dshn-action-danger" title={t('notes.item.delete')} onClick={() => { setConfirmId(note.id) }}>
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
                  <span>{relativeTime(note.updatedAt, props.t)}</span>
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
      {toast !== null ? <div className="dshn-toast" role="status">{toast}</div> : null}
    </section>
  )
}

/** Re-export for consumers that type against the injected face. */
export type { NoteKey }
