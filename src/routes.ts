/**
 * Notes HTTP routes — the browser half talks to the host through plain
 * same-origin JSON endpoints ('/api/notes/*'). Every route sits behind the
 * loopback fence (notes may hold credentials); GET /api/notes/state also
 * exposes the plugin's enable/selection-capture switches so the browser UI
 * can mount/unmount accordingly.
 * @module dsh-web-notes/routes
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import type { NoteScopeFilter } from './service.ts'
import type { NotesService } from './service.ts'
import { isLoopbackRequest } from './loopback.ts'

/** Browser-facing base path of the notes API. */
export const NOTES_API_PREFIX = '/api/notes'

/** Write one JSON response. */
function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/** Require the method or answer 405. */
function requireMethod(req: IncomingMessage, res: ServerResponse, method: string): boolean {
  if (req.method === method) return true
  json(res, 405, { ok: false, error: 'method-not-allowed' })
  return false
}

/** Read a JSON request body (bounded). */
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 512 * 1024) {
        reject(new Error('body-too-large'))
        queueMicrotask(() => req.destroy())
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid-json'))
      }
    })
    req.on('error', reject)
  })
}

/** Shared route fence: the browser UI is a loopback client; LAN hosts stay out. */
function guard(req: IncomingMessage, res: ServerResponse): boolean {
  if (isLoopbackRequest(req)) return true
  json(res, 403, { ok: false, error: 'forbidden: loopback-only' })
  return false
}

/** Wrap one async service call as a GET JSON route. */
function getRoute(path: string, run: (query: URLSearchParams) => Promise<unknown>): WebRoute {
  return {
    kind: 'exact',
    path,
    handler: (req: IncomingMessage, res: ServerResponse): void => {
      if (!guard(req, res)) return
      if (!requireMethod(req, res, 'GET')) return
      let query: URLSearchParams
      try {
        query = new URL(req.url ?? '/', 'http://notes.local').searchParams
      } catch {
        json(res, 400, { ok: false, error: 'invalid-url' })
        return
      }
      run(query).then((value) => json(res, 200, value), (error) => {
        json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      })
    },
  }
}

/** Wrap one async service call as a POST JSON route (body passed through). */
function postRoute(path: string, run: (body: Record<string, unknown>) => Promise<unknown>): WebRoute {
  return {
    kind: 'exact',
    path,
    handler: (req: IncomingMessage, res: ServerResponse): Promise<void> => {
      if (!guard(req, res)) return Promise.resolve()
      if (!requireMethod(req, res, 'POST')) return Promise.resolve()
      return readJsonBody(req).then((body) => {
        const record = (typeof body === 'object' && body !== null) ? body as Record<string, unknown> : {}
        return run(record).then(
          (value) => json(res, 200, value),
          (error) => {
            json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
          },
        )
      }, (error) => {
        json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
      })
    },
  }
}

/** Build the route family for one service. */
export function makeNotesRoutes(service: NotesService): WebRoute[] {
  const state = getRoute(NOTES_API_PREFIX + '/state', async () => ({
    enabled: service.isEnabled(),
    selectionCapture: service.isSelectionCaptureEnabled(),
    dockMode: service.dockPlacement(),
    buttonSize: service.dockSize(),
    defaultGlobal: service.isDefaultGlobal(),
  }))
  const list = getRoute(NOTES_API_PREFIX + '/list', async (query) => {
    const sessionRaw = query.get('session')
    const scopeRaw = query.get('scope')
    const sessionId = sessionRaw === null || sessionRaw === '' ? null : sessionRaw
    const scope: NoteScopeFilter = scopeRaw === 'session' || scopeRaw === 'global' ? scopeRaw : 'all'
    const opts = { sessionId, scope }
    return {
      notes: service.list(query.get('q') ?? undefined, opts),
      count: service.count(opts),
    }
  })
  const create = postRoute(NOTES_API_PREFIX + '/create', async (body) => {
    const title = body.title
    const content = body.content
    const tags = body.tags
    const source = body.source
    return service.create({
      ...(typeof title === 'string' ? { title } : {}),
      content: typeof content === 'string' ? content : '',
      ...(Array.isArray(tags) ? { tags: tags.filter((tag): tag is string => typeof tag === 'string') } : {}),
      ...(source === 'selection' || source === 'composer' ? { source } : {}),
      ...(typeof body.sessionId === 'string' || body.sessionId === null ? { sessionId: body.sessionId } : {}),
    })
  })
  const update = postRoute(NOTES_API_PREFIX + '/update', async (body) => {
    const id = body.id
    if (typeof id !== 'string' || id === '') throw new Error('invalid-id')
    return service.update(id, {
      ...(typeof body.title === 'string' ? { title: body.title } : {}),
      ...(typeof body.content === 'string' ? { content: body.content } : {}),
      ...(Array.isArray(body.tags)
        ? { tags: body.tags.filter((tag): tag is string => typeof tag === 'string') }
        : {}),
      ...(typeof body.sessionId === 'string' || body.sessionId === null ? { sessionId: body.sessionId } : {}),
    })
  })
  const remove = postRoute(NOTES_API_PREFIX + '/delete', async (body) => {
    const id = body.id
    if (typeof id !== 'string' || id === '') throw new Error('invalid-id')
    return service.remove(id)
  })
  const clear = postRoute(NOTES_API_PREFIX + '/clear', async () => service.clear())
  return [state, list, create, update, remove, clear]
}
