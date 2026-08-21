/**
 * Probe the live dsh GUI layout: conversation region geometry, header
 * controls, and candidate anchors for the dock's "fixed" (top-right) mode.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 3080
const CDP_PORT = 9300 + Math.floor(Math.random() * 400)
const browsers = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]
const browser = browsers.find((candidate) => existsSync(candidate))
if (browser === undefined) { console.error('no browser'); process.exit(1) }
const profile = mkdtempSync(join(tmpdir(), 'dshn-probe-'))
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--no-sandbox',
  '--disable-features=msEdgeFirstRunExperience,msEdgeSidebarV2,msEdgeDefaultBrowserCheck',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${CDP_PORT}`,
  `http://127.0.0.1:${PORT}/`,
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function listTargets() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
      const targets = await response.json()
      const page = targets.find((t) => t.type === 'page'
        && (t.url.includes(`127.0.0.1:${PORT}`) || t.url.includes(`localhost:${PORT}`)))
      if (page !== undefined) return page
    } catch { /* retry */ }
    await sleep(500)
  }
  return undefined
}

const main = async () => {
  const page = await listTargets()
  if (page === undefined) { console.error('no page'); process.exit(1) }
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let seq = 0
  const pending = new Map()
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id !== undefined) { const w = pending.get(msg.id); if (w) { pending.delete(msg.id); w(msg) } }
  }
  const send = (method, params = {}) => new Promise((resolve) => {
    seq += 1
    pending.set(seq, resolve)
    ws.send(JSON.stringify({ id: seq, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true })
    return result.result?.result?.value
  }
  // Wait for app boot + a conversation scroll container.
  let seen = false
  for (let i = 0; i < 60; i += 1) {
    await sleep(1000)
    seen = await evaluate(`document.querySelector('[data-conversation-scroll]') !== null`)
    if (seen) break
  }
  console.log('conversation scroll seen:', seen)
  if (!seen) process.exit(0)
  const dump = await evaluate(`(() => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) } }
    const scroll = document.querySelector('[data-conversation-scroll]');
    const root = scroll?.closest('[data-phase]');
    const header = root?.querySelector('header');
    const out = {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      scroll: scroll ? rect(scroll) : null,
      root: root ? rect(root) : null,
      header: header ? rect(header) : null,
      headerControls: [],
      phase: root?.getAttribute('data-phase') ?? null,
    };
    if (header) {
      header.querySelectorAll('button, [role="button"], select, input, a').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) out.headerControls.push({ tag: el.tagName, text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 24), r: rect(el) });
      });
    }
    return out;
  })()`)
  console.log(JSON.stringify(dump, null, 2))
  proc.kill()
  rmSync(profile, { recursive: true, force: true })
  process.exit(0)
}
main()
