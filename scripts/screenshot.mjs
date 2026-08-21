/**
 * Screenshot the notes UI on the CURRENT theme for visual inspection.
 * Usage: node scripts/screenshot.mjs [out.png]
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 3080
const CDP_PORT = 9400 + Math.floor(Math.random() * 100)
// Default output lives next to this script's project: <repo>/.logs/notes-shot.png
// (resolve from this file so the repo can be renamed/moved freely).
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = process.argv[2] ?? join(REPO_ROOT, '.logs', 'notes-shot.png')
const browser = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'dshn-shot-'))
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--no-sandbox', '--window-size=1280,800',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${CDP_PORT}`,
  `http://127.0.0.1:${PORT}/`,
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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
await send('Page.enable')

// wait for the dock
for (let i = 0; i < 60; i += 1) {
  await sleep(1000)
  if (await ev(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)) break
}
// open the panel
await ev(`document.querySelector('[data-dsh-part="notes-dock"]').click()`)
await sleep(1200)
// open the editor for a fuller view
await ev(`Array.from(document.querySelectorAll('.dshn-new-btn')).find(b => b.textContent.includes('新建') || b.textContent.includes('New'))?.click()`)
await sleep(600)
const shot = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'))
console.log('saved ' + OUT)
console.log('theme light?', await ev(`getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim()`))

try { ws.close() } catch { /* ignore */ }
try { proc.kill() } catch { /* ignore */ }
for (let i = 0; i < 5; i += 1) {
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); break } catch { await sleep(400) }
}
process.exit(0)
