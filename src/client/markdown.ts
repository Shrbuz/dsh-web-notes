/**
 * dsh-web-notes Markdown helpers — auto-detection of Markdown text in the note
 * editor and the sanitized preview renderer (marked + DOMPurify, both bundled
 * into the client artifact). Detection is deliberately conservative: plain
 * prose must not trigger the preview/edit toggle, while real Markdown (from
 * pasted AI answers, shell transcripts, notes) does.
 * @module dsh-web-notes/client/markdown
 */

import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** Configure the renderer once: GFM on, soft line breaks as <br>. */
marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * Conservative Markdown heuristics. Each pattern must be unambiguous enough
 * that everyday notes (commands, credentials, parameter values) stay free of
 * the preview toggle, while headings, lists, code fences, quotes, tables,
 * links, bold/italic and strikethrough light it up.
 */
const MD_PATTERNS: readonly RegExp[] = [
  // ATX headings: # to ###### at line start (1-3 spaces allowed).
  /(^|\n)[ \t]{0,3}#{1,6}[ \t]+/,
  // Fenced code blocks.
  /(^|\n)[ \t]{0,3}(```|~~~)/,
  // Indented code blocks (4 spaces / tab).
  /(^|\n)[ \t]{4}\S/,
  // Block quotes.
  /(^|\n)[ \t]{0,3}>[ \t]?/,
  // Unordered list items ("- " / "* " / "+ " with a following space).
  /(^|\n)[ \t]{0,3}[-*+][ \t]+/,
  // Ordered list items ("1. " / "1) ").
  /(^|\n)[ \t]{0,3}\d{1,9}[.)][ \t]+/,
  // Thematic breaks (three or more - * _ alone on a line).
  /(^|\n)[ \t]{0,3}([-*_][ \t]*){3,}$/,
  // Markdown link syntax.
  /\[[^\]]+\]\([^)]+\)/,
  // Inline code spans.
  /`[^`\n]+`/,
  // Bold / strong (double asterisks or underscores around non-space text).
  /(\*\*|__)[^*_\n]+(\*\*|__)/,
  // Italic (single asterisks around non-space, non-asterisk text).
  /(?<!\*)\*[^*\n]+\*(?!\*)/,
  // Strikethrough.
  /~~[^~\n]+~~/,
  // Table: a line with a leading pipe, or a separator row of dashes/pipes.
  /(^|\n)[ \t]{0,3}\|.*\|/,
  /(^|\n)[ \t]{0,3}\|?[ \t]*:?-{3,}[ \t]*(\|[ \t]*:?-{3,}[ \t]*)*\|?[ \t]*$/,
]

/** Whether the text looks like Markdown (empty/whitespace text never does). */
export function detectMarkdown(text: string): boolean {
  if (text.trim() === '') return false
  for (const pattern of MD_PATTERNS) {
    if (pattern.test(text)) return true
  }
  return false
}

/** Render Markdown to sanitized HTML for the preview pane (never throws). */
export function renderMarkdown(text: string): string {
  try {
    const html = marked.parse(text) as string
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  } catch {
    // A malformed document must never break the editor — fall back to
    // plain escaped text.
    return escapeHtml(text)
  }
}

/** Escape plain text for safe inline HTML fallback. */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
