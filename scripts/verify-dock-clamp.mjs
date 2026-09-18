/**
 * Regression test for the "floating icon disappeared" bug.
 *
 * ROOT CAUSE (Tabbit, 2026-09-18): the dragged dock position is persisted in
 * localStorage and was read back VERBATIM on mount. Clamping only happened
 * during a drag, so a position saved while the effective viewport was much
 * wider (wide window / zoomed-out page) — or a viewport that shrank afterwards
 * — rendered the button outside the visible area. Because the button is
 * `position: fixed` inside a 0×0 root there is no scroll that could reach it,
 * so the icon was invisible AND undraggable until the key was cleared by hand.
 * Evidence: Tabbit stored {"x":2195,"y":295.5} for http://127.0.0.1:3080 while
 * Chrome stored {"x":353,"y":49.5} and Edge had no entry at all — which is
 * exactly why only Tabbit showed no icon.
 *
 * This drives the real harness (scripts/harness/entry.tsx -> the
 * `.logs/harness/harness.js` bundle) over HTTP — a real origin, so localStorage
 * behaves as it does in the GUI — and seeds an off-screen position BEFORE the
 * harness script runs.
 *
 * Usage:
 *   pnpm exec tsdown --config tsdown.harness.config.ts
 *   node scripts/verify-dock-clamp.mjs
 *
 * Asserts:
 *   1. an off-screen persisted position is pulled back into the live viewport
 *      on mount, and the clamped value is written back;
 *   2. shrinking the viewport re-clamps it again (resize path);
 *   3. the default placement (no persisted position) is untouched.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const HARNESS_DIR = join(REPO, '.logs', 'harness')
const OUT_DIR = join(REPO, '.logs')
const CDP_PORT = 9500 + Math.floor(Math.random() * 300)
const HTTP_PORT = 9700 + Math.floor(Math.random() * 200)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Dock geometry mirrored from src/client/NotesDock.tsx. */
const DOCK_SIZE = 80
const DOCK_INSET = 6
/** The stale value found in the user's Tabbit profile. */
const STALE = { x: 2195, y: 295.5 }
const POS_KEY = 'dsh-notes.dock-position'

if (!existsSync(join(HARNESS_DIR, 'harness.js'))) {
  console.error('harness bundle missing — run: pnpm exec tsdown --config tsdown.harness.config.ts')
  process.exit(1)
}

const HTML = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dsh-web-notes harness</title>
<style>html,body{margin:0;padding:0;background:#f5f6f8;font-family:system-ui,-apple-system,sans-serif}</style>
</head><body><script src="./harness.js"></script></body></html>`

// Serve the harness over http://127.0.0.1:<port> so localStorage is a real,
// persisted origin store (on file:// it is unavailable and the seed is lost).
const server = createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]
  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(HTML)
    return
  }
  if (path === '/harness.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
    res.end(readFileSync(join(HARNESS_DIR, 'harness.js')))
    return
  }
  res.writeHead(404).end('not found')
})
await new Promise((resolve) => server.listen(HTTP_PORT, '127.0.0.1', resolve))
const pageUrl = `http://127.0.0.1:${HTTP_PORT}/`

const browsers = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]
const browser = browsers.find((candidate) => existsSync(candidate))
if (browser === undefined) {
  console.error('no Chrome/Edge found')
  server.close()
  process.exit(1)
}

const profile = mkdtempSync(join(tmpdir(), 'dshn-clamp-'))
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--no-sandbox',
  '--window-size=1280,900',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${CDP_PORT}`, 'about:blank',
], { stdio: 'ignore' })

let failures = 0
function check(name, condition, detail) {
  if (condition) {
    console.log('  ok   ' + name)
  } else {
    failures += 1
    console.log('FAIL   ' + name + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail)))
  }
}

async function connect() {
  let lastError = 'no attempt yet'
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      const target = list.find((t) => t.type === 'page')
      if (target !== undefined) return target
      lastError = 'no page target; saw ' + JSON.stringify(list.map((t) => `${t.type}:${t.url}`))
    } catch (error) {
      lastError = String(error?.cause?.message ?? error?.message ?? error)
    }
    await sleep(400)
  }
  console.error(`CDP discovery failed on port ${CDP_PORT}: ${lastError}`)
  return undefined
}

const target = await connect()
if (target === undefined) {
  try { proc.kill() } catch { /* ignore */ }
  server.close()
  process.exit(1)
}

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let seq = 0
const pending = new Map()
const pageErrors = []
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.id !== undefined) {
    pending.get(message.id)?.(message)
    pending.delete(message.id)
    return
  }
  if (message.method === 'Runtime.exceptionThrown') {
    const details = message.params?.exceptionDetails
    pageErrors.push('EXCEPTION: ' + (details?.exception?.description ?? details?.text ?? 'unknown'))
  } else if (message.method === 'Log.entryAdded') {
    pageErrors.push(`log/${message.params?.entry?.level}: ${message.params?.entry?.text}`)
  }
}
const send = (method, params = {}) => new Promise((resolve) => {
  seq += 1
  pending.set(seq, resolve)
  ws.send(JSON.stringify({ id: seq, method, params }))
})
async function ev(expression) {
  const reply = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (reply.result?.exceptionDetails !== undefined) {
    throw new Error('evaluate threw: ' + JSON.stringify(reply.result.exceptionDetails.exception?.description ?? reply.result.exceptionDetails))
  }
  return reply.result?.result?.value
}
/** Dock rect plus the persisted position, in one round trip. */
const probe = () => ev(`(() => {
  const el = document.querySelector('[data-dsh-part="notes-dock"]');
  if (el === null) return { dock: null, innerWidth: window.innerWidth, innerHeight: window.innerHeight };
  const rect = el.getBoundingClientRect();
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(${JSON.stringify(POS_KEY)}) ?? 'null'); } catch {}
  return {
    dock: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, w: Math.round(rect.width) },
    stored,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  };
})()`)
const inViewport = (p) => p.dock !== null
  && p.dock.left >= 0 && p.dock.top >= 0
  && p.dock.right <= p.innerWidth + 0.5 && p.dock.bottom <= p.innerHeight + 0.5

async function cleanup() {
  try { ws.close() } catch { /* ignore */ }
  try { proc.kill() } catch { /* ignore */ }
  server.close()
  await sleep(800)
  for (let i = 0; i < 6; i += 1) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
      return
    } catch { await sleep(500) }
  }
}

await send('Runtime.enable')
await send('Log.enable')
await send('Page.enable')

// Seed the Tabbit value BEFORE any page script runs, so the mount reads it.
const seed = await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { localStorage.setItem(${JSON.stringify(POS_KEY)}, ${JSON.stringify(JSON.stringify(STALE))}) } catch {}`,
})
await send('Page.navigate', { url: pageUrl })
await sleep(900)

for (let i = 0; i < 40; i += 1) {
  if (await ev(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)) break
  await sleep(250)
}
const mounted = await ev(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)
check('harness mounted the dock', mounted)
if (mounted !== true) {
  console.log('\n  page errors captured:')
  if (pageErrors.length === 0) console.log('    (none — the bundle may not have loaded at all)')
  for (const line of pageErrors.slice(0, 20)) console.log('    ' + line)
  await cleanup()
  process.exit(1)
}

// ------------------------------------------------- 1. stale position on mount
console.log('\n--- stale off-screen position (the reported bug) ---')
await sleep(400)
const first = await probe()
check('seed survived to mount (position was persisted)', first.stored !== null, first.stored)
check('stale x is off-screen for this viewport', STALE.x > first.innerWidth, { staleX: STALE.x, innerWidth: first.innerWidth })
check('dock is inside the viewport on mount', inViewport(first), first)

const expectedX = Math.min(STALE.x, first.innerWidth - DOCK_SIZE - DOCK_INSET)
check('dock sits at the clamped x', Math.abs(first.dock.left - expectedX) <= 1, { left: first.dock?.left, expectedX })
check('clamped position was written back to storage', first.stored?.x === expectedX, first.stored)
check('in-view y is left alone', first.stored?.y === STALE.y, first.stored)

// ------------------------------------------------- 2. viewport shrink (resize)
console.log('\n--- viewport shrink re-clamps ---')
await send('Emulation.setDeviceMetricsOverride', { width: 600, height: 500, deviceScaleFactor: 1, mobile: false })
await sleep(600)
const shrunk = await probe()
check('shrink changed the layout viewport', shrunk.innerWidth === 600, shrunk.innerWidth)
check('dock is still inside the viewport after the shrink', inViewport(shrunk), shrunk)
check('position was re-clamped and written back', shrunk.stored?.x === 600 - DOCK_SIZE - DOCK_INSET, shrunk.stored)
const image = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(OUT_DIR, 'dock-clamp.png'), Buffer.from(image.result.data, 'base64'))
await send('Emulation.clearDeviceMetricsOverride').catch(() => {})

// ------------------------------------------- 3. default placement is untouched
console.log('\n--- default placement (no persisted position) ---')
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seed.result.identifier }).catch(() => {})
await ev(`localStorage.removeItem(${JSON.stringify(POS_KEY)})`)
await send('Page.navigate', { url: pageUrl })
await sleep(900)
for (let i = 0; i < 40; i += 1) {
  if (await ev(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)) break
  await sleep(250)
}
const fresh = await probe()
check('dock mounts at the default right edge', inViewport(fresh) && fresh.innerWidth - fresh.dock.right <= 12, fresh)
check('no position is persisted while undragged', fresh.stored === null, fresh.stored)

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
console.log('screenshot: .logs/dock-clamp.png')

await cleanup()
process.exit(failures === 0 ? 0 : 1)