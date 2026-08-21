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
.dshn-root {
  /* Official semantic tokens → local aliases (fallback = original palette).
     The tokens resolve from the active theme/skin at runtime. */
  --dshn-bg-1: var(--dsw-alias-bg-layer-1, #131c36);
  --dshn-bg-2: var(--dsw-alias-bg-layer-2, #070b1a);
  --dshn-bg-3: var(--dsw-alias-bg-layer-3, #1b2653);
  --dshn-bg-base: var(--dsw-alias-bg-base, #0b1124);
  --dshn-bg-hover: var(--dsw-alias-interactive-bg-hover, rgba(126, 152, 255, 0.12));
  --dshn-text-1: var(--dsw-alias-label-primary, #eef2ff);
  --dshn-text-2: var(--dsw-alias-label-secondary, #93a1c8);
  --dshn-text-3: var(--dsw-alias-label-tertiary, #64749f);
  --dshn-text-dim: var(--dsw-alias-label-caption, #5b6a99);
  --dshn-border: var(--dsw-alias-border-l2, rgba(126, 152, 255, 0.3));
  --dshn-border-strong: var(--dsw-alias-border-l3, rgba(126, 152, 255, 0.5));
  --dshn-primary: var(--dsw-alias-button-primary-fill, #4a68f5);
  --dshn-primary-hover: var(--dsw-alias-button-primary-hover, #3a55e0);
  --dshn-primary-contrast: var(--dsw-alias-label-primary-inverted, #fff);
  --dshn-accent: var(--dsw-alias-button-contrast-fill, #8ea6ff);
  --dshn-danger: var(--dsw-alias-state-error-primary, #ef4444);
  --dshn-success: var(--dsw-alias-state-success-primary, #22c55e);
  --dshn-warn: var(--dsw-alias-state-warn-primary, #f59e0b);
  --dshn-tooltip-bg: var(--dsw-alias-tooltip-bg, #131c36);
  --dshn-code-bg: var(--dsw-alias-markdown-code-block, rgba(19, 28, 54, 0.5));
  --dshn-scroll-thumb: var(--dsw-alias-scrollbar-bg-l2, rgba(126, 152, 255, 0.25));
  --dshn-scroll-thumb-hover: var(--dsw-alias-scrollbar-hover-l2, rgba(126, 152, 255, 0.4));
  --dshn-shadow: var(--dsw-shadow-lv3, 0 8px 24px rgba(2, 6, 23, 0.45));
  --dshn-shadow-lite: var(--dsw-shadow-lv1, 0 2px 6px rgba(2, 6, 23, 0.35));

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

/* Inner icon carrier: idle float + hover lift + press squish + shine sweep. */
.dshn-dock-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
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
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, transparent 32%, color-mix(in srgb, var(--dshn-primary-contrast) 18%, transparent) 50%, transparent 68%);
  transform: translateX(-120%);
  pointer-events: none;
}

.dshn-dock:hover .dshn-dock-inner::after {
  animation: dshn-dock-shine 0.9s ease;
}

@keyframes dshn-dock-shine {
  to {
    transform: translateX(120%);
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
  width: min(400px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  background: linear-gradient(170deg, var(--dshn-bg-1), var(--dshn-bg-2));
  border-left: 1px solid var(--dshn-border);
  box-shadow:
    -12px 0 36px var(--dshn-shadow),
    -2px 0 0 color-mix(in srgb, var(--dshn-primary) 12%, transparent);
  backdrop-filter: blur(14px);
  color: var(--dshn-text-1);
  font-size: 13px;
  animation: dshn-panel-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 2147483100;
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
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--dshn-border);
}

.dshn-panel-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--dshn-text-1);
  flex: 1;
  min-width: 0;
}

.dshn-panel-count {
  font-size: 11px;
  color: var(--dshn-text-2);
  background: color-mix(in srgb, var(--dshn-primary) 12%, transparent);
  border: 1px solid var(--dshn-border);
  border-radius: 999px;
  padding: 1px 8px;
  white-space: nowrap;
}

.dshn-icon-btn {
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dshn-text-2);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-icon-btn:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-icon-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

.dshn-toolbar {
  display: flex;
  gap: 8px;
  padding: 10px 16px 8px;
}

.dshn-search {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: var(--dshn-bg-base);
  color: var(--dshn-text-1);
  font-size: 12px;
  padding: 6px 10px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-search::placeholder {
  color: var(--dshn-text-dim);
}

.dshn-search:focus {
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 35%, transparent);
}

.dshn-new-btn {
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow-lite);
  white-space: nowrap;
  transition: filter 120ms ease, transform 120ms ease, box-shadow 120ms ease;
}

.dshn-new-btn:hover {
  background: var(--dshn-primary-hover);
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.dshn-new-btn:active {
  filter: brightness(0.94);
  transform: translateY(0);
}

.dshn-new-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

/* ---- scope tabs (all / this session / global) ---- */
.dshn-scopes {
  display: flex;
  gap: 4px;
  padding: 0 16px 8px;
}

.dshn-scope {
  flex: 1;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: transparent;
  color: var(--dshn-text-2);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-scope:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-scope-active {
  background: color-mix(in srgb, var(--dshn-primary) 14%, transparent);
  border-color: var(--dshn-primary);
  color: var(--dshn-text-1);
}

.dshn-scope:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

.dshn-scopes-muted {
  color: var(--dshn-text-dim);
  font-size: 11px;
  padding-bottom: 10px;
}

/* ---- session-scope tag on list items ---- */
.dshn-scope-tag {
  color: var(--dshn-accent);
}

.dshn-scope-tag-global {
  color: var(--dshn-text-3);
  background: color-mix(in srgb, var(--dshn-text-3) 14%, transparent);
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
  border: 1px solid var(--dshn-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dshn-bg-base) 55%, transparent);
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
  position: relative;
}

.dshn-item:hover {
  border-color: var(--dshn-border-strong);
  background: var(--dshn-bg-hover);
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

.dshn-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.dshn-tag {
  font-size: 10px;
  color: var(--dshn-accent);
  background: color-mix(in srgb, var(--dshn-primary) 14%, transparent);
  border: 1px solid var(--dshn-border);
  border-radius: 999px;
  padding: 1px 7px;
  white-space: nowrap;
}

.dshn-source-tag {
  border-style: dashed;
  opacity: 0.9;
}

/* hover actions */
.dshn-item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
  gap: 4px;
}

.dshn-item:hover .dshn-item-actions,
.dshn-item:focus-within .dshn-item-actions {
  display: inline-flex;
}

.dshn-action {
  border: 1px solid var(--dshn-border-strong);
  border-radius: 7px;
  background: var(--dshn-bg-2);
  color: var(--dshn-text-2);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-action:hover {
  background: color-mix(in srgb, var(--dshn-primary) 35%, transparent);
  color: var(--dshn-primary-contrast);
  border-color: var(--dshn-primary);
}

.dshn-action-danger:hover {
  background: color-mix(in srgb, var(--dshn-danger) 30%, transparent);
  border-color: color-mix(in srgb, var(--dshn-danger) 70%, transparent);
  color: var(--dshn-danger);
}

.dshn-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
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
  border-radius: 8px;
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
  border-radius: 8px;
  background: var(--dshn-bg-base);
  color: var(--dshn-text-1);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-input::placeholder {
  color: var(--dshn-text-dim);
}

.dshn-input:focus {
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 35%, transparent);
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
  gap: 4px;
  padding: 2px;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: var(--dshn-bg-2);
  align-self: flex-start;
}

.dshn-md-btn {
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dshn-text-3);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 12px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.dshn-md-btn:hover {
  color: var(--dshn-text-1);
}

.dshn-md-btn-active {
  background: color-mix(in srgb, var(--dshn-primary) 18%, transparent);
  color: var(--dshn-text-1);
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
  border: 1px solid var(--dshn-border-strong);
  border-radius: 8px;
  background: transparent;
  color: var(--dshn-text-2);
  font-size: 12px;
  font-weight: 600;
  padding: 7px 16px;
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
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow-lite);
}

.dshn-btn-primary:hover {
  background: var(--dshn-primary-hover);
  color: var(--dshn-primary-contrast);
}

.dshn-btn-danger {
  color: var(--dshn-danger);
  border-color: color-mix(in srgb, var(--dshn-danger) 40%, transparent);
}

.dshn-btn-danger:hover {
  background: color-mix(in srgb, var(--dshn-danger) 20%, transparent);
  color: var(--dshn-danger);
}

.dshn-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

/* ---- states ---- */
.dshn-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  color: var(--dshn-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.dshn-empty-icon {
  opacity: 0.5;
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

/* ---- toast ---- */
.dshn-toast {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-tooltip-bg);
  border: 1px solid var(--dshn-border-strong);
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

/* ---- selection save bubble ---- */
.dshn-selection {
  position: fixed;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--dshn-primary) 65%, transparent);
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow), 0 0 0 1px color-mix(in srgb, var(--dshn-primary) 20%, transparent);
  cursor: pointer;
  z-index: 2147483200;
  animation: dshn-selection-in 160ms ease-out;
  transition: filter 120ms ease, transform 120ms ease;
  font-family: inherit;
  line-height: 1.4;
}

.dshn-selection:hover {
  background: var(--dshn-primary-hover);
  filter: brightness(1.1);
}

.dshn-selection:active {
  transform: scale(0.96);
}

.dshn-selection:focus-visible {
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

/* ---- settings card (设置 → 插件 → 插件配置) ---- */
.dshn-settings-card {
  border: 1px solid var(--dshn-border);
  background: var(--dshn-bg-3);
  border-radius: 12px;
  list-style: none;
  transition: border-color 160ms ease, background 160ms ease;
}

.dshn-settings-card:hover {
  border-color: var(--dshn-border-strong);
}

.dshn-settings-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px 10px;
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

.dshn-settings-body {
  border-top: 1px solid var(--dshn-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 16px;
  padding: 12px 0 14px;
}

.dshn-settings-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dshn-settings-label {
  color: var(--dshn-text-2);
  font-size: 12px;
  line-height: 1.5;
}

.dshn-settings-label .dshn-check {
  margin-right: 8px;
  vertical-align: -2px;
}

.dshn-settings-control {
  font: inherit;
  color: var(--dshn-text-1);
  background: var(--dshn-bg-base);
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-settings-control:hover {
  border-color: var(--dshn-border-strong);
}

.dshn-settings-control:focus-visible {
  outline: none;
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 35%, transparent);
}

.dshn-settings-hint {
  color: var(--dshn-text-dim);
  font-size: 11px;
  line-height: 1.5;
}

.dshn-settings-check-row {
  flex-direction: column;
  gap: 2px;
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
`;
