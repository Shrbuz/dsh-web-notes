/**
 * dsh-web-notes Markdown helpers — auto-detection of Markdown text in the note
 * editor and the sanitized preview renderer (marked + DOMPurify, both bundled
 * into the client artifact). Detection is deliberately conservative: plain
 * prose must not trigger the preview/edit toggle, while real Markdown (from
 * pasted AI answers, shell transcripts, notes) does.
 * @module dsh-web-notes/client/markdown
 */
/** Whether the text looks like Markdown (empty/whitespace text never does). */
export declare function detectMarkdown(text: string): boolean;
/** Render Markdown to sanitized HTML for the preview pane (never throws). */
export declare function renderMarkdown(text: string): string;
//# sourceMappingURL=markdown.d.ts.map