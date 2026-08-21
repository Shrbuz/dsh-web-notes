/**
 * Verify the notebook icon's reduced-motion behavior: with
 * prefers-reduced-motion: reduce the rAF choreography must be off (static
 * transforms) and the writing lines must remain visible (static pose).
 * Usage: node scripts/check-reduced.mjs
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 3080
const CDP_PORT = 9500 + Math.floor(Math.random() * 100)
const browser = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'dshn-reduced-'))
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--no-sandbox',
  '--force-prefers-reduced-motion',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${CDP_PORT}`,
  `http://127.0.0.1:${PORT}/`,
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
const check = (name, ok) => { console.log((ok ? '  ok  ' : 'FAIL  ') + name); if (!ok) failures += 1 }

async function target() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page' && t.url.includes(`:${PORT}`))
      if (page) return page
    } catch { /* retry */ }
    await sleep(500)
  }
  return undefined
}

const page = await target()
if (!page) { console.error('no page'); process.exit(1) }
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let seq = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id !== undefined) { pending.get(m.id)?.(m); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => {
  seq += 1; pending.set(seq, res); ws.send(JSON.stringify({ id: seq, method, params }))
})
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.result?.value
}

await send('Runtime.enable')
for (let i = 0; i < 60; i += 1) {
  await sleep(1000)
  if (await ev(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)) break
}

check('reduced motion matched', await ev(`window.matchMedia('(prefers-reduced-motion: reduce)').matches`) === true)
const f0 = await ev(`document.querySelector('.dshn-ani-float')?.getAttribute('transform') ?? null`)
const l1 = await ev(`document.querySelector('.dshn-ani-line')?.getAttribute('transform') ?? null`)
const l1c = await ev(`document.querySelector('.dshn-ani-line')?.className ?? null`)
await sleep(700)
const f1 = await ev(`document.querySelector('.dshn-ani-float')?.getAttribute('transform') ?? null`)
console.log('  DIAG f0=' + f0 + ' f1=' + f1 + ' l1=' + l1 + ' class=' + l1c)
check('icon is static under reduced motion', f0 === f1)
check('writing lines visible in static pose', l1 === 'scale(1 1)')

try { ws.close() } catch { /* ignore */ }
try { proc.kill() } catch { /* ignore */ }
for (let i = 0; i < 5; i += 1) {
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); break } catch { await sleep(400) }
}
console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
