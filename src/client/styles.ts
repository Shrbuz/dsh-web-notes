/**
 * dsh-web-notes styles — theme-adaptive. Every color rides a local `--dshn-*`
 * variable that maps to the OFFICIAL dsh design tokens (`--dsw-alias-*`,
 * defined by the `dsh-client-ui-theme` plugin on <body>), with the original
 * dark-glass palette as fallback. Because skins (dsh-skins / skin-center)
 * recolor the app by redefining those same tokens, the notes UI follows the
 * official light/dark theme out of the box AND any installed skin — live, no
 * reload. Injected by the client bundle at factory execution; the module
 * loader removes the style tag on unload. All classes are prefixed `dshn-`.
 * @module dsh-web-notes/client/styles
 */

export const NOTES_CSS = `
/* Design tokens on body (NOT :root): the official --dsw-* tokens are
   defined on <body> (light values on body, dark values redefined on
   body[data-ds-dark-theme]). CSS custom properties inherit down the tree,
   so --dshn-* must be declared on body too — declaring them on :root would
   resolve var(--dsw-*) at the html level where the dsw tokens do not exist,
   silently falling back to the light defaults and never following dark
   themes or skins. body scope also covers the settings card, which lives in
   the official settings dialog outside .dshn-root. */
body {
  --dshn-bg-1: var(--dsw-alias-bg-layer-1, #ffffff);
  --dshn-bg-2: var(--dsw-alias-bg-layer-2, #ffffff);
  --dshn-bg-base: var(--dsw-alias-bg-base, #ffffff);
  --dshn-bg-overlay: var(--dsw-alias-bg-overlay, #e9ecf2);
  --dshn-bg-hover: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06));
  --dshn-bg-active: var(--dsw-alias-interactive-bg-active, rgba(38, 49, 72, 0.1));
  --dshn-text-1: var(--dsw-alias-label-primary, #0f1115);
  --dshn-text-2: var(--dsw-alias-label-secondary, #61666b);
  --dshn-text-3: var(--dsw-alias-label-tertiary, #81858c);
  --dshn-text-dim: var(--dsw-alias-label-caption, #adb2b8);
  --dshn-border: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
  --dshn-border-strong: var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.12));
  --dshn-border-lite: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.04));
  --dshn-primary: var(--dsw-alias-state-business-primary, #4176e6);
  --dshn-primary-hover: var(--dsw-alias-state-business-primary, #4176e6);
  --dshn-primary-weak: var(--dsw-alias-state-business-weak, rgba(65, 118, 230, 0.12));
  /* Button label color: the OFFICIAL primary-button foreground. Follows the
     theme (dark buttons get light text; in dark themes the button flips to
     a light fill with dark text — hardcoding white here caused white-on-white). */
  --dshn-primary-contrast: var(--dsw-alias-label-primary-foreground, #ffffff);
  /* Settings-card surface: the OFFICIAL plugin cards use
     label-primary-inverted as their background (white in light themes,
     #353638 neutral grey in dark) — NOT bg-layer-1, which is darker. */
  --dshn-card-bg: var(--dsw-alias-label-primary-inverted, #ffffff);
  --dshn-accent: var(--dsw-alias-state-business-primary, #4176e6);
  --dshn-btn-fill: var(--dsw-alias-button-primary-fill, #0f1115);
  --dshn-btn-hover: var(--dsw-alias-button-primary-hover, #43454a);
  --dshn-neutral-500: var(--dsw-static-neutral-bluish-500, #979da6);
  --dshn-neutral-600: var(--dsw-static-neutral-bluish-600, #81858c);
  --dshn-neutral-700: var(--dsw-static-neutral-bluish-700, #61666b);
  --dshn-danger: var(--dsw-alias-state-error-primary, #ec1313);
  --dshn-warn: var(--dsw-alias-state-warn-primary, #f59e0b);
  --dshn-tooltip-bg: var(--dsw-alias-tooltip-bg, #2c2c2e);
  --dshn-bg-3: var(--dsw-alias-bg-overlay, #e9ecf2);
  --dshn-code-bg: var(--dsw-alias-markdown-inline-code, #ebeef2);
  --dshn-scroll-thumb: var(--dsw-static-neutral-bluish-500, rgba(0, 0, 0, 0.25));
  --dshn-scroll-thumb-hover: var(--dsw-static-neutral-bluish-600, rgba(0, 0, 0, 0.4));
  --dshn-shadow: var(--dsw-shadow-lv3, 0 12px 32px rgba(0, 0, 0, 0.12));
  --dshn-shadow-lite: var(--dsw-shadow-lv1, 0 2px 4px rgba(0, 0, 0, 0.05));
}

.dshn-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 2147483000;
}

/* ---- floating dock button (right edge, vertically centered, draggable) ---- */
.dshn-dock {
  --dshn-dock-size: 80px;
  --dshn-dock-scale: 1;
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: var(--dshn-dock-size);
  height: var(--dshn-dock-size);
  border-radius: calc(var(--dshn-dock-size) * 0.3);
  border: 1px solid var(--dshn-border-strong);
  background: linear-gradient(165deg, var(--dshn-bg-1), var(--dshn-bg-2));
  box-shadow:
    var(--dshn-shadow-lite),
    inset 0 1px 0 color-mix(in srgb, var(--dshn-primary-contrast) 10%, transparent);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  padding: 0;
  font: inherit;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

/* Size presets (large = the original 80 px button). */
.dshn-dock[data-size="small"] {
  --dshn-dock-size: 48px;
  --dshn-dock-scale: 0.6;
}

.dshn-dock[data-size="regular"] {
  --dshn-dock-size: 64px;
  --dshn-dock-scale: 0.8;
}

.dshn-dock[data-size="large"] {
  --dshn-dock-size: 80px;
  --dshn-dock-scale: 1;
}

/* The notebook icon scales with the button (46/80 of the container). */
.dshn-dock svg {
  width: calc(var(--dshn-dock-size) * 0.575);
  height: calc(var(--dshn-dock-size) * 0.575);
}

/* Dragged (inline left/top): no translate centering, no right-edge pin. */
.dshn-dock-absolute {
  right: auto;
  transform: none;
}

/* Pinned mode: fixed to the conversation window's top-right corner, not
   draggable (no drag handlers are attached in this mode). */
.dshn-dock-fixed {
  right: auto;
  top: auto;
  transform: none;
  cursor: pointer;
}

.dshn-dock:hover {
  border-color: color-mix(in srgb, var(--dshn-primary) 70%, transparent);
  box-shadow:
    var(--dshn-shadow),
    inset 0 1px 0 color-mix(in srgb, var(--dshn-primary-contrast) 12%, transparent),
    0 0 14px color-mix(in srgb, var(--dshn-primary) 30%, transparent);
}

.dshn-dock:active {
  cursor: grabbing;
}

.dshn-dock-dragging {
  cursor: grabbing;
}

.dshn-dock:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

/* Inner icon carrier: idle float + hover lift + press squish + shine sweep.
   overflow:hidden clips the shine sweep strictly inside the rounded button —
   without it the gloss bar leaks past the container edge and reads as a
   stray white strip next to the dock. */
.dshn-dock-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  overflow: hidden;
  transition: transform 140ms ease, filter 140ms ease;
  pointer-events: none;
}

/* SVG animation groups: per-element transform origins for the notebook
   choreography (float / cover breathe / line draw / bookmark flutter /
   pen travel / sparkle pop). Driven by the rAF keyframe engine in
   NotebookIcon — CSS here only fixes the transform geometry. */
.dshn-ani-cover {
  transform-box: fill-box;
  transform-origin: center;
}

.dshn-ani-line {
  transform-box: fill-box;
  transform-origin: left center;
}

.dshn-ani-bookmark {
  transform-box: fill-box;
  transform-origin: 50% 0;
}

.dshn-ani-pen {
  transform-box: fill-box;
  transform-origin: left center;
}

.dshn-ani-sparkle {
  transform-box: fill-box;
  transform-origin: center;
}

.dshn-dock:hover .dshn-dock-inner {
  transform: scale(1.06);
  filter: brightness(1.1);
}

.dshn-dock:active .dshn-dock-inner {
  animation: none;
  transform: scale(0.92);
}

.dshn-dock-dragging .dshn-dock-inner {
  animation: none;
  transform: scale(1);
}

.dshn-dock-inner::after {
  content: '';
  position: absolute;
  /* A full-height diagonal light STREAK — a WIDE band for a fuller sweep,
     but square edges (no inherited radius) so it never reads as the button's
     own rounded silhouette sliding across. */
  top: -6%;
  bottom: -6%;
  left: 0;
  width: 80%;
  border-radius: 0;
  /* White gloss streak — a moderate plateau of light with WIDE soft edges:
     the bright core is narrow, and the fade-out on both sides is long, so
     it reads as a diffused glow rather than a hard band. */
  background: linear-gradient(105deg,
    transparent 12%,
    color-mix(in srgb, #ffffff 24%, transparent) 42%,
    color-mix(in srgb, #ffffff 24%, transparent) 58%,
    transparent 88%);
  transform: translateX(-130%);
  pointer-events: none;
}

.dshn-dock:hover .dshn-dock-inner::after {
  animation: dshn-dock-shine 0.45s linear;
}

@keyframes dshn-dock-shine {
  to {
    transform: translateX(130%);
  }
}

.dshn-dock-badge {
  position: absolute;
  top: calc(-5px * var(--dshn-dock-scale));
  right: calc(-6px * var(--dshn-dock-scale));
  min-width: calc(17px * var(--dshn-dock-scale));
  height: calc(17px * var(--dshn-dock-scale));
  padding: 0 calc(4px * var(--dshn-dock-scale));
  border: 1px solid color-mix(in srgb, var(--dshn-primary) 60%, transparent);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: calc(10px * var(--dshn-dock-scale));
  font-weight: 600;
  line-height: 1;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow-lite);
  pointer-events: none;
}

.dshn-dock-tooltip {
  position: absolute;
  right: calc(100% + calc(10px * var(--dshn-dock-scale)));
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-tooltip-bg);
  border: 1px solid var(--dshn-border);
  box-shadow: var(--dshn-shadow-lite);
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease;
}

.dshn-dock:hover .dshn-dock-tooltip {
  opacity: 1;
}

/* ---- panel ---- */
.dshn-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(var(--dshn-panel-width, 400px), calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  background: var(--dshn-bg-1);
  border-left: 1px solid var(--dshn-border);
  box-shadow: var(--dshn-shadow);
  color: var(--dshn-text-1);
  font-size: 13px;
  animation: dshn-panel-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 2147483100;
}

/* Draggable left-edge resize handle — a slim vertical gutter that widens
   the panel. Invisible by default, gains a grip hint on hover/drag. */
.dshn-panel-resize {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 5px;
  cursor: col-resize;
  z-index: 2;
  touch-action: none;
}
.dshn-panel-resize::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: 1px;
  background: var(--dshn-border);
  opacity: 0;
  transition: opacity 120ms ease;
}
.dshn-panel-resize:hover::after,
.dshn-panel-resize:active::after {
  opacity: 1;
}

@keyframes dshn-panel-in {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.dshn-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--dshn-border-lite);
}

.dshn-panel-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--dshn-text-1);
  flex: 1;
  min-width: 0;
}

.dshn-panel-title-icon {
  color: var(--dshn-neutral-600);
  flex-shrink: 0;
  opacity: 0.9;
}

.dshn-panel-count {
  font-size: 11px;
  color: var(--dshn-text-2);
  background: var(--dshn-bg-overlay);
  border-radius: 4px;
  padding: 1px 7px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.dshn-icon-btn {
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--dshn-text-2);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 120ms ease, color 120ms ease;
}

.dshn-icon-btn:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-icon-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

.dshn-toolbar {
  display: flex;
  gap: 8px;
  padding: 10px 16px 8px;
}

.dshn-search {
  flex: 1;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: var(--dshn-bg-overlay);
  color: var(--dshn-text-1);
  font-size: 12px;
  padding: 6px 10px;
  outline: none;
  transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-search:hover {
  background: color-mix(in srgb, var(--dshn-bg-overlay) 80%, var(--dshn-bg-hover));
}

.dshn-search:focus {
  background: var(--dshn-bg-1);
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 25%, transparent);
}

.dshn-search::placeholder {
  color: var(--dshn-text-dim);
}

.dshn-new-btn {
  border: none;
  border-radius: 6px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-btn-fill);
  white-space: nowrap;
  transition: background 120ms ease, transform 90ms ease;
}

.dshn-new-btn:hover {
  background: var(--dshn-btn-hover);
}

.dshn-new-btn:active {
  transform: scale(0.97);
  transition-duration: 40ms;
}

.dshn-new-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

/* ---- scope tabs (all / this session / global) ---- */
.dshn-scopes {
  display: flex;
  gap: 4px;
  padding: 0 16px 8px;
}

.dshn-scope {
  flex: 1;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--dshn-text-2);
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, color 120ms ease;
}

.dshn-scope:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-scope-active {
  background: var(--dshn-primary-weak);
  color: var(--dshn-primary);
  font-weight: 600;
}

.dshn-scope:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

.dshn-scopes-muted {
  color: var(--dshn-text-dim);
  font-size: 11px;
  padding-bottom: 10px;
}

/* ---- session-scope tag on list items ---- */
.dshn-scope-tag {
  color: var(--dshn-primary);
  background: var(--dshn-primary-weak);
}

.dshn-scope-tag-global {
  color: var(--dshn-neutral-600);
  background: var(--dshn-bg-overlay);
}

/* ---- editor "save to global" checkbox ---- */
.dshn-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--dshn-text-2);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.dshn-check {
  width: 14px;
  height: 14px;
  accent-color: var(--dshn-primary);
  cursor: pointer;
}

/* ---- note list ---- */
.dshn-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dshn-list::-webkit-scrollbar {
  width: 8px;
}

.dshn-list::-webkit-scrollbar-thumb {
  background: var(--dshn-scroll-thumb);
  border-radius: 999px;
}

.dshn-list::-webkit-scrollbar-thumb:hover {
  background: var(--dshn-scroll-thumb-hover);
}

.dshn-item {
  border: 1px solid var(--dshn-border-lite);
  border-radius: 8px;
  background: var(--dshn-bg-1);
  padding: 10px 12px 10px 16px;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, box-shadow 140ms ease, transform 90ms ease;
  position: relative;
}

/* Semantic rail — a slim 2px accent line on the item's left edge,
   uniformly the official business blue (global and session alike).
   The rail is subtle at rest and grows into a short rounded bar on
   hover, echoing the app's interactive accents. */
.dshn-item::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: var(--dshn-neutral-600);
  opacity: 0.45;
  transition: top 140ms ease, bottom 140ms ease, background 140ms ease, opacity 140ms ease;
}

.dshn-item-global::before,
.dshn-item-session::before {
  background: var(--dshn-primary);
  opacity: 0.8;
}

.dshn-item:hover {
  border-color: var(--dshn-border);
  background: var(--dshn-bg-overlay);
}

.dshn-item:hover::before {
  top: 8px;
  bottom: 8px;
  opacity: 1;
}

.dshn-item:active {
  transform: scale(0.99);
  transition-duration: 40ms;
}

.dshn-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 35%, transparent);
}

.dshn-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dshn-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
  padding-right: 56px;
}

.dshn-item-preview {
  font-size: 12px;
  color: var(--dshn-text-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.dshn-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--dshn-text-3);
}

/* Relative time pushed to the right for a quieter, more organized rhythm. */
.dshn-item-time {
  margin-left: auto;
  color: var(--dshn-text-dim);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dshn-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.dshn-tag {
  font-size: 10px;
  color: var(--dshn-text-2);
  background: var(--dshn-bg-overlay);
  border: none;
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}

.dshn-source-tag {
  color: var(--dshn-neutral-600);
}

/* hover actions — horizontal icon+label pills on the item's top-right.
   Opaque backgrounds + z-index keep the note title from bleeding through. */
.dshn-item-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(-3px);
  transition: opacity 120ms ease, transform 120ms ease;
  z-index: 2;
}

.dshn-item:hover .dshn-item-actions,
.dshn-item:focus-within .dshn-item-actions {
  opacity: 1;
  transform: translateY(0);
}

.dshn-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--dshn-border);
  border-radius: 6px;
  background: var(--dshn-bg-1);
  color: var(--dshn-text-2);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: var(--dshn-shadow-lite);
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 90ms ease;
}

.dshn-action svg {
  flex-shrink: 0;
}

.dshn-action:hover {
  background: var(--dshn-bg-1);
  color: var(--dshn-primary);
  border-color: color-mix(in srgb, var(--dshn-primary) 40%, transparent);
  box-shadow: var(--dshn-shadow);
}

.dshn-action:active {
  transform: scale(0.95);
  transition-duration: 40ms;
}

.dshn-action-danger:hover {
  background: color-mix(in srgb, var(--dshn-danger) 10%, transparent);
  border-color: color-mix(in srgb, var(--dshn-danger) 30%, transparent);
  color: var(--dshn-danger);
}

.dshn-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

/* ---- editor ---- */
.dshn-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  overflow-y: auto;
}

.dshn-editor-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dshn-editor-back {
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--dshn-text-2);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.dshn-editor-back:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-editor-title-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--dshn-text-1);
  flex: 1;
  min-width: 0;
}

.dshn-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--dshn-border);
  border-radius: 6px;
  background: var(--dshn-bg-1);
  color: var(--dshn-text-1);
  font-size: 13px;
  padding: 7px 10px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-input::placeholder {
  color: var(--dshn-text-dim);
}

.dshn-input:focus {
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 25%, transparent);
}

.dshn-textarea {
  flex: 1;
  min-height: 160px;
  resize: none;
  line-height: 1.6;
  font-family: inherit;
}

/* ---- Markdown preview/edit toggle + preview pane ---- */
.dshn-md-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--dshn-border-lite);
  border-radius: 6px;
  background: var(--dshn-bg-overlay);
  align-self: flex-start;
}

.dshn-md-btn {
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dshn-text-3);
  font-size: 12px;
  font-weight: 500;
  padding: 3px 12px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.dshn-md-btn:hover {
  color: var(--dshn-text-1);
}

.dshn-md-btn-active {
  background: var(--dshn-bg-1);
  color: var(--dshn-text-1);
  font-weight: 600;
  box-shadow: var(--dshn-shadow-lite);
}

.dshn-md-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

.dshn-md-preview {
  flex: 1;
  min-height: 160px;
  overflow-y: auto;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: var(--dshn-bg-base);
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dshn-text-1);
  word-break: break-word;
}

.dshn-md-preview::-webkit-scrollbar {
  width: 8px;
}

.dshn-md-preview::-webkit-scrollbar-thumb {
  background: var(--dshn-scroll-thumb);
  border-radius: 999px;
}

.dshn-md-body > :first-child {
  margin-top: 0;
}

.dshn-md-body > :last-child {
  margin-bottom: 0;
}

.dshn-md-body h1,
.dshn-md-body h2,
.dshn-md-body h3,
.dshn-md-body h4,
.dshn-md-body h5,
.dshn-md-body h6 {
  color: var(--dshn-text-1);
  font-weight: 700;
  line-height: 1.35;
  margin: 0.9em 0 0.4em;
}

.dshn-md-body h1 { font-size: 1.45em; }
.dshn-md-body h2 { font-size: 1.3em; }
.dshn-md-body h3 { font-size: 1.15em; }
.dshn-md-body h4 { font-size: 1.05em; }
.dshn-md-body h5, .dshn-md-body h6 { font-size: 0.95em; }

.dshn-md-body p {
  margin: 0.5em 0;
}

.dshn-md-body a {
  color: var(--dshn-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dshn-md-body strong {
  color: var(--dshn-text-1);
  font-weight: 700;
}

.dshn-md-body ul,
.dshn-md-body ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.dshn-md-body li {
  margin: 0.2em 0;
}

.dshn-md-body li > input[type='checkbox'] {
  accent-color: var(--dshn-primary);
  margin-right: 6px;
  vertical-align: -2px;
}

.dshn-md-body code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  background: var(--dshn-code-bg);
  border: 1px solid var(--dshn-border);
  border-radius: 4px;
  padding: 0.1em 0.35em;
}

.dshn-md-body pre {
  background: var(--dshn-code-bg);
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  margin: 0.6em 0;
}

.dshn-md-body pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.88em;
  line-height: 1.55;
}

.dshn-md-body blockquote {
  margin: 0.6em 0;
  padding: 2px 12px;
  border-left: 3px solid var(--dshn-primary);
  background: color-mix(in srgb, var(--dshn-primary) 8%, transparent);
  color: var(--dshn-text-2);
}

.dshn-md-body table {
  border-collapse: collapse;
  margin: 0.6em 0;
  width: 100%;
  font-size: 0.92em;
}

.dshn-md-body th,
.dshn-md-body td {
  border: 1px solid var(--dshn-border);
  padding: 4px 10px;
  text-align: left;
}

.dshn-md-body th {
  background: color-mix(in srgb, var(--dshn-primary) 10%, transparent);
  color: var(--dshn-text-1);
  font-weight: 600;
}

.dshn-md-body hr {
  border: none;
  border-top: 1px solid var(--dshn-border-strong);
  margin: 0.9em 0;
}

.dshn-md-body img {
  max-width: 100%;
  border-radius: 8px;
}

.dshn-md-body del {
  color: var(--dshn-text-dim);
}

.dshn-md-body :not(pre) > code {
  word-break: break-word;
}

.dshn-editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dshn-btn {
  border: 1px solid var(--dshn-border);
  border-radius: 6px;
  background: transparent;
  color: var(--dshn-text-2);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-btn:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dshn-btn-primary {
  border: none;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-btn-fill);
}

.dshn-btn-primary:hover {
  background: var(--dshn-btn-hover);
  color: var(--dshn-primary-contrast);
}

.dshn-btn-danger {
  color: var(--dshn-danger);
  border-color: color-mix(in srgb, var(--dshn-danger) 25%, transparent);
}

.dshn-btn-danger:hover {
  background: color-mix(in srgb, var(--dshn-danger) 8%, transparent);
  color: var(--dshn-danger);
}

.dshn-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

/* ---- states ---- */
.dshn-empty {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  text-align: center;
  color: var(--dshn-text-3);
  font-size: 12px;
  line-height: 1.6;
}

/* Illustrated empty-state guide. */
.dshn-empty-art {
  margin-bottom: 8px;
  animation: dshn-empty-float 3.2s ease-in-out infinite;
  filter: drop-shadow(0 6px 14px color-mix(in srgb, var(--dshn-primary) 18%, transparent));
}

@keyframes dshn-empty-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.dshn-empty-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dshn-text-1);
  letter-spacing: 0.01em;
}

.dshn-empty-hint {
  max-width: 260px;
  color: var(--dshn-text-2);
  font-size: 12px;
  line-height: 1.6;
  margin-bottom: 10px;
}

.dshn-empty-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-btn-fill);
  transition: background 120ms ease, transform 90ms ease;
}

.dshn-empty-new:hover {
  background: var(--dshn-btn-hover);
}

.dshn-empty-new:active {
  transform: scale(0.96);
  transition-duration: 40ms;
}

.dshn-empty-new:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

.dshn-loading,
.dshn-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dshn-text-3);
  font-size: 12px;
  padding: 24px;
}

.dshn-error {
  color: var(--dshn-danger);
}

/* ---- footer: star prompt with GitHub / CNB links ---- */
.dshn-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--dshn-border-lite);
}

.dshn-footer-text {
  font-size: 11px;
  color: var(--dshn-text-3);
  line-height: 1.5;
  text-align: center;
}

.dshn-footer-links {
  display: inline-flex;
  gap: 8px;
}

.dshn-footer-link {
  font-size: 11px;
  font-weight: 600;
  color: var(--dshn-primary);
  text-decoration: none;
  padding: 3px 12px;
  border: 1px solid var(--dshn-border);
  border-radius: 999px;
  background: var(--dshn-bg-overlay);
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.dshn-footer-link:hover {
  background: var(--dshn-primary-weak);
  border-color: color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

.dshn-footer-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

/* Bottom close affordance: coarse pointers only (see the touch block at the
   end of this sheet) — a thumb-reach dismissal for tall phones. Desktop has
   the header X, ESC and click-outside and never sees this button. */
.dshn-footer-close {
  display: none;
}

/* ---- toast ---- */
.dshn-toast {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-tooltip-bg);
  box-shadow: var(--dshn-shadow);
  animation: dshn-toast-in 180ms ease-out;
  white-space: nowrap;
  max-width: calc(100% - 32px);
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes dshn-toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* ---- selection bubble (save as note + insert to conversation) ---- */
.dshn-selection {
  position: fixed;
  display: flex;
  gap: 6px;
  z-index: 2147483200;
  animation: dshn-selection-in 160ms ease-out;
}

.dshn-selection-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--dshn-primary) 65%, transparent);
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  line-height: 1.4;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow), 0 0 0 1px color-mix(in srgb, var(--dshn-primary) 20%, transparent);
  cursor: pointer;
  transition: filter 120ms ease, background 120ms ease;
}
.dshn-selection-btn:hover {
  background: var(--dshn-primary-hover);
  filter: brightness(1.1);
}
.dshn-selection-btn:active {
  filter: brightness(0.9);
}
.dshn-selection-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

@keyframes dshn-selection-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ---- settings card (设置 → 插件 → 插件配置) ----
   Mirrors the official plugin-card pattern: a collapsible header row with a
   rotating chevron, expanding into the form. */
.dshn-settings-card {
  border: 1px solid var(--dshn-border-lite);
  background: var(--dshn-card-bg);
  border-radius: 12px;
  list-style: none;
  transition: border-color 160ms ease;
}

.dshn-settings-card:hover {
  border-color: var(--dshn-border);
}

.dshn-settings-card-open {
  border-color: var(--dshn-border);
}

/* Header: full-width button, name + description left, chevron right.
   Padding mirrors the official card header (14px/16px) so the collapsed
   height matches the built-in plugin cards exactly. */
.dshn-settings-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
}

.dshn-settings-headText {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dshn-settings-name {
  color: var(--dshn-text-1);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.dshn-settings-description {
  color: var(--dshn-text-3);
  font-size: 13px;
  line-height: 1.5;
}

.dshn-settings-chevron {
  flex-shrink: 0;
  color: var(--dshn-text-3);
  transition: transform 180ms ease;
}

.dshn-settings-chevron-open {
  transform: rotate(180deg);
}

/* Expanded body — mirrors the official card body: full-bleed fields with a
   divider between them, bottom padding only (official: 0/0/8/0). */
.dshn-settings-body {
  border-top: 1px solid var(--dshn-border-lite);
  display: flex;
  flex-direction: column;
  padding: 0 0 8px;
}

.dshn-settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
}

/* Divider between fields — matches the official card row divider
   (1px solid border-l2, the 12% hairline), not the faintest l1. */
.dshn-settings-field + .dshn-settings-field {
  border-top: 1px solid var(--dshn-border);
}

.dshn-settings-label {
  color: var(--dshn-text-2);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}

/* Segmented control — tab-style picker replacing the native select. */
.dshn-settings-seg {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--dshn-bg-overlay);
  border-radius: 6px;
  align-self: flex-start;
}

.dshn-settings-seg-btn {
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dshn-text-3);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 14px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.dshn-settings-seg-btn:hover {
  color: var(--dshn-text-1);
}

.dshn-settings-seg-active {
  background: var(--dshn-bg-1);
  color: var(--dshn-text-1);
  font-weight: 600;
  box-shadow: var(--dshn-shadow-lite);
}

.dshn-settings-seg-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

/* Switch row: label left, toggle right (aligned with official controls). */
.dshn-settings-field-switch {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.dshn-settings-switch {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.dshn-settings-switch input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.dshn-settings-switch-track {
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: var(--dshn-neutral-500);
  position: relative;
  transition: background 140ms ease;
}

.dshn-settings-switch-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform 140ms ease;
}

.dshn-settings-switch input:checked + .dshn-settings-switch-track {
  background: var(--dshn-primary);
}

.dshn-settings-switch input:checked + .dshn-settings-switch-track::after {
  transform: translateX(14px);
}

.dshn-settings-switch input:focus-visible + .dshn-settings-switch-track {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .dshn-panel,
  .dshn-toast,
  .dshn-selection {
    animation: none;
  }

  .dshn-dock,
  .dshn-dock-inner,
  .dshn-action,
  .dshn-btn,
  .dshn-new-btn {
    animation: none;
    transition: none;
  }

  .dshn-dock-inner::after {
    display: none;
  }
}

/* ---- touch / coarse-pointer adaptation ---------------------------------
   Phones and tablets: interactive controls grow to the 44px touch-target
   recommendation, hover-only affordances become permanent (there is no hover
   on touch, which left the per-note action pills effectively unreachable),
   and the resize gutter widens. Fine-pointer desktops are untouched —
   everything here is scoped to the pointer: coarse media feature. */
@media (pointer: coarse) {
  /* Header controls: the close X and the editor's back button. */
  .dshn-icon-btn,
  .dshn-editor-back {
    width: 44px;
    height: 44px;
  }

  /* The 5px resize gutter is untappable with a finger. */
  .dshn-panel-resize {
    width: 14px;
  }

  /* 16px keeps iOS Safari from zooming the viewport when a field is focused.
     Single-line inputs get a full touch height; the editor textarea keeps its
     own 160px floor (it is the one field that should stay tall). */
  .dshn-search,
  .dshn-input {
    font-size: 16px;
  }

  .dshn-search,
  .dshn-input:not(.dshn-textarea) {
    min-height: 44px;
  }

  .dshn-new-btn,
  .dshn-btn,
  .dshn-empty-new,
  .dshn-scope,
  .dshn-md-btn,
  .dshn-selection-btn {
    min-height: 44px;
  }

  .dshn-check {
    width: 20px;
    height: 20px;
  }

  /* Secondary footer links stay one notch below a primary action — still well
     above the 24px minimum, without bloating the footer. */
  .dshn-footer-link {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
  }

  /* Bottom close: thumb reach on tall phones. */
  .dshn-footer-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--dshn-border);
    border-radius: 8px;
    background: var(--dshn-bg-overlay);
    color: var(--dshn-text-2);
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  .dshn-footer-close:active {
    background: var(--dshn-bg-hover);
    color: var(--dshn-text-1);
  }

  .dshn-footer-close:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 40%, transparent);
  }

  /* Note cards: the hover-only action pills become a permanent action row at
     the card's foot. The card turns into a column flex here so the row can be
     ordered after the meta/tags instead of floating over the title. */
  .dshn-item {
    display: flex;
    flex-direction: column;
  }

  .dshn-item-actions {
    position: static;
    order: 10;
    margin-top: 8px;
    opacity: 1;
    transform: none;
    flex-wrap: wrap;
  }

  .dshn-action {
    flex: 1 1 auto;
    justify-content: center;
    min-height: 44px;
  }

  /* No floating pills to reserve room for. */
  .dshn-item-title {
    padding-right: 0;
  }
}

/* ---- narrow screens ----------------------------------------------------
   The panel already clamps its width to min(panel-width, 100vw - 24px). On a
   phone that leftover strip IS the tap-outside dismissal area, so the panel is
   deliberately not widened to 100vw — only the gutters tighten. */
@media (max-width: 420px) {
  .dshn-panel-header,
  .dshn-toolbar,
  .dshn-scopes,
  .dshn-editor,
  .dshn-footer {
    padding-left: 12px;
    padding-right: 12px;
  }

  .dshn-list {
    padding-left: 8px;
    padding-right: 8px;
  }
}
`
