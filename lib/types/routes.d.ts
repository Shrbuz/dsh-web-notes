/**
 * Notes HTTP routes — the browser half talks to the host through plain
 * same-origin JSON endpoints ('/api/notes/*'). Every route sits behind the
 * loopback fence (notes may hold credentials); GET /api/notes/state also
 * exposes the plugin's enable/selection-capture switches so the browser UI
 * can mount/unmount accordingly.
 * @module dsh-web-notes/routes
 */
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { NotesService } from './service.ts';
/** Browser-facing base path of the notes API. */
export declare const NOTES_API_PREFIX = "/api/notes";
/** Build the route family for one service. */
export declare function makeNotesRoutes(service: NotesService): WebRoute[];
//# sourceMappingURL=routes.d.ts.map