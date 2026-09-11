/**
 * Verify the notes client UI's coarse-pointer (touch) adaptation and its
 * dismissal semantics.
 *
 * Runs against the standalone harness (scripts/harness/entry.tsx -> the
 * `.logs/harness/harness.js` bundle built by tsdown.harness.config.ts), so it
 * needs neither the running dsh web server nor its browser-auth cookie.
 *
 * Usage:
 *   pnpm exec tsdown --config tsdown.harness.config.ts
 *   node scripts/verify-touch.mjs
 *
 * Asserts, per the touch/UX issue:
 *   1. fine pointer (desktop): close X stays 28px, bottom close hidden,
 *      card actions stay absolutely positioned (hover-only) — i.e. the
 *      touch block leaks nowhere.
 *   2. coarse pointer: close X and the editor back button become 44x44,
 *      the bottom close appears, card actions become a static tappable row,
 *      the resize gutter widens, the panel keeps its narrow-screen clamp.
 *   3. dismissal semantics: an outside tap dismisses, a tap inside or on the
 *      dock does not, and EVERY panel dismissal persists an in-progress draft
 *      (explicit close = save) while blank drafts are dropped.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const HARNESS_DIR = join(REPO, '.logs', 'harness')
const OUT_DIR = join(REPO, '.logs')
const CDP_PORT = 9500 + Math.floor(Math.random() * 300)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

if (!existsSync(join(HARNESS_DIR, 'harness.js'))) {
  console.error('harness bundle missing — run: pnpm exec tsdown --config tsdown.harness.config.ts')
  process.exit(1)
}

const html = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dsh-web-notes harness</title>
<style>html,body{margin:0;padding:0;background:#f5f6f8;font-family:system-ui,-apple-system,sans-serif}</style>
</head><body><script src="./harness.js"></script></body></html>`
writeFileSync(join(HARNESS_DIR, 'index.html'), html)

const browsers = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]
const browser = browsers.find((candidate) => existsSync(candidate))
if (browser === undefined) {
  console.error('no Chrome/Edge found')
  process.exit(1)
}

const profile = mkdtempSync(join(tmpdir(), 'dshn-harness-'))
const page = pathToFileURL(join(HARNESS_DIR, 'index.html')).href
// Start on about:blank and navigate only AFTER Runtime/Log are enabled, so no
// early load-time exception can escape the capture below.
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--no-sandbox', '--allow-file-access-from-files',
  '--window-size=420,900',
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

/** Connect to the harness page over CDP. */
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
  console.error(`chrome exited: ${proc.exitCode === null ? 'still running' : 'code ' + proc.exitCode}`)
  return undefined
}

const target = await connect()
if (target === undefined) {
  console.error('harness page never appeared')
  try { proc.kill() } catch { /* ignore */ }
  process.exit(1)
}

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let seq = 0
const pending = new Map()
/** Page-side failures, so a harness that never mounts explains itself. */
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
  } else if (message.method === 'Runtime.consoleAPICalled') {
    const text = (message.params?.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' ')
    pageErrors.push(`${message.params?.type}: ${text}`)
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
const shot = async (file) => {
  const image = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(OUT_DIR, file), Buffer.from(image.result.data, 'base64'))
}

/** Tear everything down; Chrome needs a moment to release the temp profile. */
async function cleanup() {
  try { ws.close() } catch { /* ignore */ }
  try { proc.kill() } catch { /* ignore */ }
  await sleep(800)
  for (let i = 0; i < 6; i += 1) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
      return
    } catch { await sleep(500) }
  }
}

/** Computed-metrics probe for one selector. */
const metrics = (selector) => ev(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (el === null) return null;
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return {
    w: Math.round(rect.width), h: Math.round(rect.height),
    display: style.display, position: style.position,
    minHeight: style.minHeight, fontSize: style.fontSize, ariaLabel: el.getAttribute('aria-label'),
  };
})()`)

const panelOpen = () => ev(`document.querySelector('[data-dsh-notes-panel]') !== null`)
async function ensurePanelOpen() {
  if (await panelOpen()) return
  await ev(`document.querySelector('[data-dsh-part="notes-dock"]').click()`)
  await sleep(250)
}
async function closePanelIfOpen() {
  if (await panelOpen()) {
    await ev(`document.querySelector('[data-dsh-part="notes-dock"]').click()`)
    await sleep(200)
  }
}
/** Open the editor with `text` typed into the content area (real input event). */
async function startDraft(text) {
  await ensurePanelOpen()
  await ev(`document.querySelector('.dshn-new-btn').click()`)
  await sleep(180)
  if (text !== '') {
    await ev(`(() => {
      const area = document.querySelector('.dshn-textarea');
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(area, ${JSON.stringify(text)});
      area.dispatchEvent(new Event('input', { bubbles: true }));
    })()`)
    await sleep(180)
  }
}
const calls = () => ev('window.__harness.getCalls()')

await send('Runtime.enable')
await send('Log.enable')
await send('Page.enable')
await send('Page.navigate', { url: page })
await sleep(700)

// Wait for the harness to mount the dock.
for (let i = 0; i < 60; i += 1) {
  if (await ev(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)) break
  await sleep(300)
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

// ---------------------------------------------------------------- fine pointer
console.log('\n--- fine pointer (desktop) ---')
check('pointer: coarse is off', (await ev(`matchMedia('(pointer: coarse)').matches`)) === false)
await ensurePanelOpen()
const deskClose = await metrics('.dshn-icon-btn')
check('desktop close X stays 28x28', deskClose?.w === 28 && deskClose?.h === 28, deskClose)
check('desktop close X labels itself "关闭" (was the panel title)', deskClose?.ariaLabel === '关闭', deskClose?.ariaLabel)
const deskFooter = await metrics('.dshn-footer-close')
check('desktop bottom close is hidden', deskFooter === null || deskFooter.display === 'none', deskFooter)
const deskActions = await metrics('.dshn-item-actions')
check('desktop card actions stay hover-only (absolute)', deskActions?.position === 'absolute', deskActions)
const deskResize = await metrics('.dshn-panel-resize')
check('desktop resize gutter stays 5px', deskResize?.w === 5, deskResize)
await shot('touch-desktop.png')

// -------------------------------------------------------------- coarse pointer
console.log('\n--- coarse pointer (touch) ---')
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await send('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
})
await sleep(400)
let coarse = await ev(`matchMedia('(pointer: coarse)').matches`)
if (coarse !== true) {
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' })
  await sleep(400)
  coarse = await ev(`matchMedia('(pointer: coarse)').matches`)
}
check('pointer: coarse matches under touch emulation', coarse === true, coarse)

if (coarse === true) {
  const touchClose = await metrics('.dshn-icon-btn')
  check('touch close X is >= 44x44', touchClose !== null && touchClose.w >= 44 && touchClose.h >= 44, touchClose)
  const back = await metrics('.dshn-editor-back')
  const backOk = back === null || (back.w >= 44 && back.h >= 44)
  check('touch editor back button is >= 44x44 (once in the editor)', backOk, back)
  const footer = await metrics('.dshn-footer-close')
  check('touch bottom close is visible', footer !== null && footer.display !== 'none', footer)
  check('touch bottom close is a >= 44px target', footer !== null && footer.h >= 44, footer)
  const actions = await metrics('.dshn-item-actions')
  check('touch card actions become a static row', actions?.position === 'static', actions)
  const action = await metrics('.dshn-action')
  check('touch action pills are >= 44px tall', action !== null && action.h >= 44, action)
  const item = await metrics('.dshn-item')
  check('touch note card is a column flex', item?.display === 'flex', item)
  const resize = await metrics('.dshn-panel-resize')
  check('touch resize gutter widens to 14px', resize?.w === 14, resize)
  const search = await metrics('.dshn-search')
  check('touch search field is >= 44px and 16px font (no iOS zoom)', search !== null && search.h >= 44 && search.fontSize === '16px', search)
  const width = await ev(`Math.round(document.querySelector('.dshn-panel').getBoundingClientRect().width)`)
  check('narrow screen keeps a tap-outside strip', 390 - width >= 20, { width, strip: 390 - width })
  await shot('touch-coarse.png')
}

// ------------------------------------------------------- dismissal semantics
console.log('\n--- dismissal semantics ---')
await send('Emulation.clearDeviceMetricsOverride').catch(() => {})
await send('Emulation.setTouchEmulationEnabled', { enabled: false }).catch(() => {})
await sleep(250)

await ev('window.__harness.reset()')
await closePanelIfOpen()
await ensurePanelOpen()
await ev(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`)
await sleep(250)
check('outside tap dismisses the panel', (await panelOpen()) === false)
check('outside tap with no draft persists nothing', (await calls()).length === 0, await calls())

await ensurePanelOpen()
await ev(`document.querySelector('.dshn-panel-header').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`)
await sleep(200)
check('pointerdown inside the panel keeps it open', (await panelOpen()) === true)

await ev(`document.querySelector('[data-dsh-part="notes-dock"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`)
await ev(`document.querySelector('[data-dsh-part="notes-dock"]').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))`)
await sleep(200)
check('pointerdown on the dock does not dismiss (no double toggle)', (await panelOpen()) === true)

/** Each dismissal path must persist the in-progress draft (explicit close = save). */
async function dismissalCase(name, text, dismiss) {
  await ev('window.__harness.reset()')
  await closePanelIfOpen()
  await startDraft(text)
  await dismiss()
  await sleep(450)
  const recorded = await calls()
  const saved = recorded.some((call) => call.fn === 'create' && call.args.content === text)
  check(`${name} persists the draft`, saved, recorded)
  check(`${name} closes the panel`, (await panelOpen()) === false)
}

// The X lives in the LIST view header only — the editor header carries a back
// button instead, and the bottom close lives in the list footer — so no draft
// can ever be in flight on those two paths; their flush is a deliberate no-op.
await ev('window.__harness.reset()')
await closePanelIfOpen()
await ensurePanelOpen()
await ev(`document.querySelector('.dshn-icon-btn').click()`)
await sleep(300)
check('X close dismisses the panel', (await panelOpen()) === false)
check('X close in the list view persists nothing', (await calls()).length === 0, await calls())

// The three paths that CAN dismiss while a draft is open must all persist it.
await dismissalCase('ESC', 'ESC 保存', async () => {
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`)
})
await dismissalCase('dock toggle', 'DOCK 保存', async () => {
  await ev(`document.querySelector('[data-dsh-part="notes-dock"]').click()`)
})
await dismissalCase('outside tap while editing', 'OUTSIDE 保存', async () => {
  await ev(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`)
})

// The editor's Cancel is the ONE explicit discard: it exits the editor without
// persisting and deliberately leaves the panel open.
await ev('window.__harness.reset()')
await closePanelIfOpen()
await startDraft('CANCEL 不保存')
await ev(`Array.from(document.querySelectorAll('.dshn-editor-footer .dshn-btn')).find((b) => !b.classList.contains('dshn-btn-primary')).click()`)
await sleep(400)
check('editor Cancel discards the draft (no host call)', (await calls()).length === 0, await calls())
check('editor Cancel keeps the panel open', (await panelOpen()) === true)
await closePanelIfOpen()
// The bottom close lives in the LIST view footer (the editor has its own
// footer), so there is never a draft to flush on that path.
await ev('window.__harness.reset()')
await closePanelIfOpen()
await ensurePanelOpen()
await ev(`document.querySelector('.dshn-footer-close').click()`)
await sleep(300)
check('bottom close button dismisses the panel', (await panelOpen()) === false)
check('bottom close persists nothing in the list view', (await calls()).length === 0, await calls())

// A blank draft must be dropped, not saved as an empty note.
await ev('window.__harness.reset()')
await closePanelIfOpen()
await startDraft('   ')
await ev(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`)
await sleep(400)
check('blank draft is dropped, not saved', (await calls()).length === 0, await calls())

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
console.log('screenshots: .logs/touch-desktop.png, .logs/touch-coarse.png')

await cleanup()
process.exit(failures === 0 ? 0 : 1)