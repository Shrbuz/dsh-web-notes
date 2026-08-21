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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services (sessions + conversation power insert-into-composer; the
 * settings scope + slots drive the plugin card in 设置 → 插件 → 插件配置). */
export declare const inject: string[];
/**
 * Client plugin body: inject the styles, read the host switches, and mount
 * the floating notes dock for the page lifetime.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map