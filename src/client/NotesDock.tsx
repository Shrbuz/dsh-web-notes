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

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react'
import type { ISessions, SessionListState, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { NotesApi, NoteView, NotesButtonSize } from './api.ts'
import { NotesPanel, type NoteDraft } from './NotesPanel.tsx'
import type { NotesUiSettings } from './settings.ts'
import { deriveUiSettings } from './settings.ts'

/** How the dock places the selection bubble. */
interface SelectionState {
  text: string
  x: number
  y: number
}

/** A dragged dock position in viewport coordinates (left/top of the button). */
interface DockPosition {
  x: number
  y: number
}

/** Props of the notes dock. */
export interface NotesDockProps {
  api: NotesApi
  t: (key: string, params?: Record<string, unknown>) => string
  /** Insert one note into the composer (or copy it when no session is open). Returns a toast copy. */
  onInsert: (note: NoteView) => string
  /** Whether the selection-capture bubble is enabled (host switch). */
  selectionCapture: boolean
  /** The sessions service, so the dock knows the current session for scoping. */
  sessions: ISessions
  /** The bound `notes` settings scope: dock mode + button size + default scope, live. */
  settingsScope: SettingsScope<NotesUiSettings>
}

/** Dock button size presets in px (large = the original 80 px). */
const DOCK_SIZES: Record<NotesButtonSize, number> = { small: 48, regular: 64, large: 80 }
/** Pointer travel before a press becomes a drag (px). */
const DRAG_THRESHOLD = 5
/** localStorage key for the dragged position. */
const POS_STORAGE_KEY = 'dsh-notes.dock-position'
/** Viewport inset clamp for the dragged dock (px). */
const DOCK_INSET = 6
/** Inset of the fixed dock from the conversation region's top-right corner (px). */
const FIXED_INSET = 12
/** Anchor of the fixed dock: the conversation message scroll container. */
const FIXED_ANCHOR = '[data-conversation-scroll]'

/** Load the persisted dock position; tolerant of corrupt/missing entries. */
function loadDockPosition(): DockPosition | null {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown }
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number'
      && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
      return { x: parsed.x, y: parsed.y }
    }
  } catch {
    // Corrupt entry: fall back to the default placement.
  }
  return null
}

/** Persist the dragged dock position. */
function saveDockPosition(pos: DockPosition): void {
  try {
    localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos))
  } catch {
    // localStorage can be unavailable (private mode); the drag still works
    // for the current page.
  }
}

/** Clamp a dragged coordinate so the dock stays fully inside the viewport. */
function clampDock(value: number, limit: number, size: number): number {
  return Math.min(Math.max(value, DOCK_INSET), Math.max(DOCK_INSET, limit - size - DOCK_INSET))
}

/**
 * Notebook icon with a Lottie-style keyframe choreography, driven by a tiny
 * rAF engine (no external animation library): the notebook floats, its cover
 * breathes and nods, the bookmark flutters, two lines draw themselves as a
 * pen travels across them, then the lines fade out and the loop restarts,
 * with a sparkle popping at the end. Theme-adaptive (all fills ride the
 * --dshn-* tokens); honours prefers-reduced-motion (static pose) and pauses
 * on hidden tabs.
 */
function NotebookIcon(): ReactElement {
  // Static centering group (the icon content is nudged so its geometric
  // center sits exactly on the viewBox center — see CENTER_X/Y below).
  const centerRef = useRef<SVGGElement | null>(null)
  const coverRef = useRef<SVGGElement | null>(null)
  const line1Ref = useRef<SVGGElement | null>(null)
  const line2Ref = useRef<SVGGElement | null>(null)
  const bookmarkRef = useRef<SVGGElement | null>(null)
  const penRef = useRef<SVGGElement | null>(null)
  const sparkleRef = useRef<SVGGElement | null>(null)

  useEffect(() => {
    // Easing curves.
    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3)
    const easeInOut = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
    const easeOutBack = (x: number): number => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
    }

    /** Piecewise keyframe sampling with easing between knots. */
    const sample = (
      kfs: readonly (readonly [number, number])[],
      t: number,
      ease: (x: number) => number,
    ): number => {
      if (t <= kfs[0][0]) return kfs[0][1]
      for (let i = 1; i < kfs.length; i += 1) {
        const [t0, v0] = kfs[i - 1]
        const [t1, v1] = kfs[i]
        if (t <= t1) {
          const span = t1 - t0 || 1
          return v0 + (v1 - v0) * ease((t - t0) / span)
        }
      }
      return kfs[kfs.length - 1][1]
    }

    // One loop = 3200 ms. All keyframes are [time (ms), value] and return to
    // their start values at 3200 so the loop is seamless.
    const LOOP_MS = 3200
    const line1: readonly (readonly [number, number])[] = [[0, 0], [1150, 0], [1650, 1], [2950, 1], [3150, 0]]
    const line2: readonly (readonly [number, number])[] = [[0, 0], [1400, 0], [1900, 1], [3000, 1], [3200, 0]]
    const penTravel: readonly (readonly [number, number])[] = [[1250, 0], [1700, 15.5]]
    const penOpacity: readonly (readonly [number, number])[] = [[0, 0], [1250, 0], [1320, 1], [1680, 1], [1780, 0], [3200, 0]]
    const coverScale: readonly (readonly [number, number])[] = [
      [0, 1], [600, 1], [1800, 1.02], [2250, 1], [2400, 1], [2520, 0.965], [2660, 1], [3200, 1],
    ]
    const sparkleOpacity: readonly (readonly [number, number])[] = [[0, 0], [2100, 0], [2200, 1], [2450, 1], [2580, 0], [3200, 0]]
    const sparkleScale: readonly (readonly [number, number])[] = [[0, 0], [2200, 0.4], [2300, 1], [2450, 1], [2580, 0], [3200, 0]]

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) {
      // Static pose: lines visible, everything else at rest.
      line1Ref.current?.setAttribute('transform', 'scale(1 1)')
      line2Ref.current?.setAttribute('transform', 'scale(1 1)')
      return
    }
    let raf = 0
    let start = 0
    let running = true

    const tick = (now: number): void => {
      if (!running) return
      if (start === 0) start = now
      const t = (now - start) % LOOP_MS

      // Cover breathe + nod.
      const cover = sample(coverScale, t, easeInOut)
      coverRef.current?.setAttribute('transform', `scale(1 ${cover.toFixed(4)})`)

      // Writing lines (draw out, hold, erase back).
      line1Ref.current?.setAttribute('transform', `scale(${sample(line1, t, easeOutCubic).toFixed(4)} 1)`)
      line2Ref.current?.setAttribute('transform', `scale(${sample(line2, t, easeOutCubic).toFixed(4)} 1)`)

      // Bookmark flutter (constant sine).
      const flutter = Math.sin((t / 1200) * Math.PI * 2) * 5
      bookmarkRef.current?.setAttribute('transform', `rotate(${flutter.toFixed(2)})`)

      // Pen: travels along the first line while it draws.
      penRef.current?.setAttribute('transform', `translate(${sample(penTravel, t, easeOutCubic).toFixed(2)} 0)`)
      penRef.current?.setAttribute('opacity', sample(penOpacity, t, easeInOut).toFixed(3))

      // Sparkle pop near the end of the loop.
      sparkleRef.current?.setAttribute('transform', `scale(${sample(sparkleScale, t, easeOutBack).toFixed(4)})`)
      sparkleRef.current?.setAttribute('opacity', sample(sparkleOpacity, t, easeInOut).toFixed(3))

      raf = window.requestAnimationFrame(tick)
    }

    const onVisibility = (): void => {
      if (document.hidden) {
        running = false
        if (raf !== 0) window.cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        start = 0
        raf = window.requestAnimationFrame(tick)
      }
    }

    raf = window.requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      running = false
      if (raf !== 0) window.cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="dshn-notes-cover" x1="8" y1="2" x2="40" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--dshn-primary)' }} />
          <stop offset="1" style={{ stopColor: 'var(--dshn-primary-hover)' }} />
        </linearGradient>
      </defs>
      {/* Static centering: the notebook content's geometric center (measured
          from the static pose) sits at (20.85, 24.5) in a 48x48 viewBox —
          nudge it onto the exact center (24, 24). The icon no longer floats. */}
      <g ref={centerRef} transform="translate(3.1 -0.5)" className="dshn-ani-float">
        {/* Page block visible at the right edge (depth) */}
        <path
          d="M12 7 h21 a3 3 0 0 1 3 3 v31 a3 3 0 0 1 -3 3 H12 a3 3 0 0 1 -3 -3 V10 a3 3 0 0 1 3 -3 z"
          style={{ fill: 'var(--dshn-bg-base)' }}
        />
        {/* Cover + spine (breathe/nod together) */}
        <g ref={coverRef} className="dshn-ani-cover">
          <path
            d="M10 4 h22 a4 4 0 0 1 4 4 v32 a4 4 0 0 1 -4 4 H10 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 z"
            fill="url(#dshn-notes-cover)"
            style={{ stroke: 'color-mix(in srgb, var(--dshn-primary-contrast) 40%, transparent)' }}
            strokeWidth="0.8"
          />
          <path
            d="M10 4 h7 v41 H10 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 z"
            style={{ fill: 'var(--dshn-primary-hover)' }}
            opacity="0.9"
          />
          <circle cx="6.6" cy="10" r="0.9" style={{ fill: 'var(--dshn-primary-contrast)' }} opacity="0.85" />
          <circle cx="6.6" cy="17" r="0.9" style={{ fill: 'var(--dshn-primary-contrast)' }} opacity="0.85" />
          <circle cx="6.6" cy="24" r="0.9" style={{ fill: 'var(--dshn-primary-contrast)' }} opacity="0.85" />
          <circle cx="6.6" cy="31" r="0.9" style={{ fill: 'var(--dshn-primary-contrast)' }} opacity="0.85" />
          <circle cx="6.6" cy="38" r="0.9" style={{ fill: 'var(--dshn-primary-contrast)' }} opacity="0.85" />
          {/* Static lower lines (they breathe with the cover) */}
          <path
            d="M13.5 26 h14.5 M13.5 32.5 h16.5"
            style={{ stroke: 'var(--dshn-primary-contrast)' }}
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
        {/* Animated writing lines: draw out, hold, erase back */}
        <g ref={line1Ref} className="dshn-ani-line">
          <path
            d="M13.5 13 h15.5"
            style={{ stroke: 'var(--dshn-primary-contrast)' }}
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
        <g ref={line2Ref} className="dshn-ani-line">
          <path
            d="M13.5 19.5 h18.5"
            style={{ stroke: 'var(--dshn-primary-contrast)' }}
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
        {/* Gold bookmark ribbon (flutters) */}
        <g ref={bookmarkRef} className="dshn-ani-bookmark">
          <path
            d="M30 4 v10.5 l-3.6 -2.9 -3.6 2.9 V4 z"
            style={{ fill: 'var(--dsw-static-amber-400, #f5c542)', stroke: 'var(--dsw-static-amber-600, #e0ac2e)' }}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </g>
        {/* Pen (travels across line 1 while it draws) */}
        <g ref={penRef} className="dshn-ani-pen" opacity="0">
          <path
            d="M13.2 8.6 l4.4 -4.4"
            style={{ stroke: 'var(--dshn-primary-contrast)' }}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="13.2" cy="8.6" r="0.8" style={{ fill: 'var(--dshn-primary-contrast)' }} />
        </g>
        {/* Sparkle (pops near the loop end) */}
        <g ref={sparkleRef} className="dshn-ani-sparkle" opacity="0">
          <path
            d="M24 30.5 L25.3 33.7 L28.5 35 L25.3 36.3 L24 39.5 L22.7 36.3 L19.5 35 L22.7 33.7 Z"
            style={{ fill: 'var(--dsw-static-amber-400, #f5c542)' }}
          />
        </g>
      </g>
    </svg>
  )
}

/** The floating notes dock. */
export function NotesDock(props: NotesDockProps): ReactElement {
  const { api, t, onInsert, selectionCapture, sessions, settingsScope } = props
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [seed, setSeed] = useState<NoteDraft | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [pos, setPos] = useState<DockPosition | null>(() => loadDockPosition())
  const [dragging, setDragging] = useState(false)

  // UI preferences from the settings namespace, live (the settings card and
  // the dock share this scope, so a change in 设置 → 插件 applies instantly).
  const ui = useSyncExternalStore<NotesUiSettings>(
    useCallback((listener) => settingsScope.subscribe(listener), [settingsScope]),
    useCallback(() => deriveUiSettings(settingsScope), [settingsScope]),
  )
  const dockSize = DOCK_SIZES[ui.buttonSize]
  const fixedMode = ui.dockMode === 'fixed'

  // Fixed mode: pin the dock to the conversation window's top-right corner.
  // The anchor is the conversation message scroll container; its geometry is
  // re-measured on resize/layout change and periodically (the element can be
  // replaced by session navigation).
  const [fixedPos, setFixedPos] = useState<DockPosition | null>(null)
  useEffect(() => {
    if (!fixedMode) return
    let timer: number | undefined
    const measure = (): void => {
      const anchor = document.querySelector(FIXED_ANCHOR)
      if (anchor instanceof HTMLElement) {
        const rect = anchor.getBoundingClientRect()
        const size = DOCK_SIZES[ui.buttonSize]
        setFixedPos({ x: rect.right - size - FIXED_INSET, y: rect.top + FIXED_INSET })
      } else {
        setFixedPos(null)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    const observer = new ResizeObserver(measure)
    const anchor = document.querySelector(FIXED_ANCHOR)
    if (anchor instanceof HTMLElement) observer.observe(anchor)
    // Belt-and-suspenders: the anchor element may be replaced (session
    // navigation) without a resize — a slow poll keeps the corner honest.
    timer = window.setInterval(measure, 1500)
    return () => {
      window.removeEventListener('resize', measure)
      observer.disconnect()
      if (timer !== undefined) window.clearInterval(timer)
    }
  }, [fixedMode, ui.buttonSize])

  // Current session (reactive): session-scoped notes only show while their
  // session is current; global notes always show. Null on the hero screen.
  const sessionList = useSyncExternalStore<SessionListState>(
    useCallback((listener) => sessions.list.subscribe(listener), [sessions]),
    useCallback(() => sessions.list.getSnapshot(), [sessions]),
  )
  const currentSessionId = sessionList.current ?? null

  const rootRef = useRef<HTMLDivElement | null>(null)
  const dockRef = useRef<HTMLButtonElement | null>(null)
  const bubbleRef = useRef<HTMLButtonElement | null>(null)
  const selectionRef = useRef<SelectionState | null>(null)
  const posRef = useRef<DockPosition | null>(pos)
  const dragRef = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])
  useEffect(() => {
    posRef.current = pos
  }, [pos])

  /** Refresh the badge count for the current context (session notes + global). */
  const refreshCount = useCallback((): void => {
    api.list(undefined, { session: currentSessionId, scope: 'all' }).then((result) => {
      setCount(result.count)
    }, () => {
      // Ignore transport errors; the next refresh resyncs.
    })
  }, [api, currentSessionId])

  useEffect(() => {
    refreshCount()
  }, [refreshCount])

  // ESC closes the panel; opening the panel re-reads the count.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const openWithDraft = useCallback((draft: NoteDraft): void => {
    setSeed(draft)
    setOpen(true)
  }, [])

  const saveSelection = useCallback((text: string): void => {
    const firstLine = text.split('\n').find((line) => line.trim() !== '') ?? ''
    const title = firstLine.length > 32 ? firstLine.slice(0, 32) + '…' : firstLine
    setSelection(null)
    openWithDraft({
      title,
      content: text,
      tags: '',
      source: 'selection',
      // Selections captured while a session is current default to that
      // session's scope — unless "default save global" is on.
      sessionId: currentSessionId,
      global: ui.defaultGlobal || currentSessionId === null,
    })
  }, [openWithDraft, currentSessionId, ui.defaultGlobal])

  // ---- dock dragging ----
  // A press without travel toggles the panel through the button's onClick
  // (which also keeps keyboard activation working); a real drag sets this
  // flag so the click that follows a drag is swallowed.
  const clickSuppressed = useRef(false)

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0) return
    // A new press resets the drag-suppression: only the click that directly
    // follows a drag is swallowed, never a later interaction.
    clickSuppressed.current = false
    const button = dockRef.current
    if (button === null) return
    const rect = button.getBoundingClientRect()
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: posRef.current?.x ?? rect.left,
      originY: posRef.current?.y ?? rect.top,
      moved: false,
    }
    try {
      button.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic pointers (tests) have no capture; dragging still works.
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (fixedMode) return
    const state = dragRef.current
    if (state === null) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    state.moved = true
    setDragging(true)
    setPos({
      x: clampDock(state.originX + dx, window.innerWidth, dockSize),
      y: clampDock(state.originY + dy, window.innerHeight, dockSize),
    })
  }

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (fixedMode) return
    const state = dragRef.current
    dragRef.current = null
    setDragging(false)
    if (state?.moved) {
      // Swallow the click the browser fires after the drag. Compute the final
      // position from the drag state directly (React state may not have
      // flushed by the time pointerup fires inside the same event batch).
      clickSuppressed.current = true
      const final: DockPosition = {
        x: clampDock(state.originX + (event.clientX - state.startX), window.innerWidth, dockSize),
        y: clampDock(state.originY + (event.clientY - state.startY), window.innerHeight, dockSize),
      }
      posRef.current = final
      saveDockPosition(final)
    }
  }

  const onClick = (): void => {
    if (clickSuppressed.current) {
      clickSuppressed.current = false
      return
    }
    const next = !open
    setOpen(next)
    if (next) refreshCount()
  }

  // ---- text-selection capture (scroll-following bubble) ----
  useEffect(() => {
    if (!selectionCapture) return
    let timer: number | undefined
    let raf: number | undefined

    /** Whether a node lives outside the notes UI (selections inside it never capture). */
    const outsideNotesUi = (node: Node | null): boolean => {
      if (node === null) return true
      if (node.nodeType === Node.ELEMENT_NODE) {
        if ((node as Element).closest?.('[data-dsh-notes-root]') !== null) return false
      } else if (node.parentElement !== null && node.parentElement.closest('[data-dsh-notes-root]') !== null) {
        return false
      }
      return true
    }

    /** Live client rect of the current selection, or null when it has no visual extent. */
    const selectionRect = (sel: Selection): DOMRect | null => {
      if (sel.rangeCount === 0) return null
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      return rect.width === 0 && rect.height === 0 ? null : rect
    }

    /** Place the bubble above the selection's current viewport position. */
    const placeBubble = (sel: Selection): void => {
      const rect = selectionRect(sel)
      if (rect === null) {
        setSelection(null)
        return
      }
      const x = Math.min(Math.max(rect.left, 8), window.innerWidth - 150)
      const y = Math.min(Math.max(rect.top - 42, 8), window.innerHeight - 44)
      setSelection({ text: sel.toString().trim(), x, y })
    }

    const checkSelection = (): void => {
      const sel = window.getSelection()
      const text = sel?.toString().trim() ?? ''
      if (text === '' || sel === null || sel.isCollapsed || !outsideNotesUi(sel.anchorNode)) {
        setSelection(null)
        return
      }
      placeBubble(sel)
    }

    const schedule = (): void => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = window.setTimeout(checkSelection, 120)
    }

    // Scroll: the selection's range rect is live in client coordinates, so
    // re-reading it moves the bubble along while the page scrolls (rAF
    // throttled). It disappears only when the selection leaves the viewport
    // or collapses — never merely because the page moved.
    const onScroll = (): void => {
      if (selectionRef.current === null || raf !== undefined) return
      raf = window.requestAnimationFrame(() => {
        raf = undefined
        const sel = window.getSelection()
        if (sel === null || sel.isCollapsed || !outsideNotesUi(sel.anchorNode)) {
          setSelection(null)
          return
        }
        const rect = selectionRect(sel)
        if (rect === null
          || rect.bottom < 0 || rect.top > window.innerHeight
          || rect.right < 0 || rect.left > window.innerWidth) {
          setSelection(null)
          return
        }
        const x = Math.min(Math.max(rect.left, 8), window.innerWidth - 150)
        const y = Math.min(Math.max(rect.top - 42, 8), window.innerHeight - 44)
        setSelection((prev) => (prev === null ? prev : { ...prev, x, y }))
      })
    }

    // Hide when the user clicks elsewhere on the page or switches windows.
    const onPointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && bubbleRef.current?.contains(event.target) === true) return
      setSelection(null)
    }
    const onBlur = (): void => { setSelection(null) }
    const onVisibilityChange = (): void => {
      if (document.hidden) setSelection(null)
    }

    document.addEventListener('mouseup', schedule)
    document.addEventListener('selectionchange', schedule)
    document.addEventListener('scroll', onScroll, true)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
      if (raf !== undefined) window.cancelAnimationFrame(raf)
      document.removeEventListener('mouseup', schedule)
      document.removeEventListener('selectionchange', schedule)
      document.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [selectionCapture])

  const floatingStyle: CSSProperties = pos === null
    ? { right: 10, top: '50%' }
    : { left: pos.x, top: pos.y }
  const dockStyle: CSSProperties = fixedMode
    ? (fixedPos === null ? { right: FIXED_INSET, top: FIXED_INSET } : { left: fixedPos.x, top: fixedPos.y })
    : floatingStyle
  const dockClass = [
    'dshn-dock',
    fixedMode ? 'dshn-dock-fixed' : (pos === null ? '' : 'dshn-dock-absolute'),
    dragging ? 'dshn-dock-dragging' : '',
  ].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className="dshn-root" data-dsh-notes-root>
      <button
        ref={dockRef}
        type="button"
        className={dockClass}
        style={dockStyle}
        aria-label={t('notes.dock.tooltip')}
        data-dsh-part="notes-dock"
        data-mode={ui.dockMode}
        data-size={ui.buttonSize}
        onPointerDown={fixedMode ? undefined : onPointerDown}
        onPointerMove={fixedMode ? undefined : onPointerMove}
        onPointerUp={fixedMode ? undefined : endDrag}
        onPointerCancel={fixedMode ? undefined : endDrag}
        onClick={onClick}
      >
        <span className="dshn-dock-inner">
          <NotebookIcon />
          {count > 0 ? <span className="dshn-dock-badge">{count > 99 ? '99+' : count}</span> : null}
        </span>
        <span className="dshn-dock-tooltip">{t('notes.dock.tooltip')}</span>
      </button>

      {open
        ? (
          <NotesPanel
            api={api}
            t={t}
            sessionId={currentSessionId}
            defaultGlobal={ui.defaultGlobal}
            onInsert={onInsert}
            onClose={() => { setOpen(false) }}
            onChanged={setCount}
            seed={seed}
            onSeedConsumed={() => { setSeed(null) }}
          />
        )
        : null}

      {selection !== null
        ? (
          <button
            ref={bubbleRef}
            type="button"
            className="dshn-selection"
            style={{ left: selection.x, top: selection.y }}
            onClick={() => { saveSelection(selection.text) }}
            data-dsh-part="notes-selection-save"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: '-1px', marginRight: 5 }} aria-hidden="true">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            {t('notes.selection.save')}
          </button>
        )
        : null}
    </div>
  )
}
