/**
 * Probe #5: settings → 插件 — dump only the dialog-internal structure.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
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
const profile = mkdtempSync(join(tmpdir(), 'dshn-probe6-'))
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
  for (let i = 0; i < 60; i += 1) {
    await sleep(1000)
    if (await evaluate(`document.querySelector('[data-conversation-scroll]') !== null`)) break
  }
  const clickByText = async (text, clsPart = '') => {
    return evaluate(`(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === ${JSON.stringify(text)} && (${JSON.stringify(clsPart)} === '' || String(b.className).includes(${JSON.stringify(clsPart)})));
      if (btn) { btn.click(); return true }
      return false
    })()`)
  }
  const step = async (name, fn) => {
    const ok = await fn()
    console.log(`STEP ${name}: ${ok ? 'ok' : 'MISS'}`)
    return ok
  }
  // Sidebar may boot expanded or collapsed (layout persists host-side) — the
  // settings trigger exists in both states, so open it by class directly.
  await step('open settings', () => evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => String(b.className).includes('VOzbGW_trigger'));
    if (btn) { btn.click(); return true }
    return false
  })()`))
  await sleep(1200)
  console.log('dialog after settings click:', await evaluate(`!!document.querySelector('[role="dialog"]')`))
  await step('click plugins nav', () => clickByText('插件', 'VOzbGW_navCell'))
  await sleep(1200)
  const dump = await evaluate(`(() => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
    const dialog = document.querySelector('[role="dialog"]');
    const out = { dialogInner: '', dialogButtons: [], heading: null };
    if (!dialog) { out.dialogInner = 'NO DIALOG'; return out; }
    out.dialogInner = (dialog.innerText || '').slice(0, 1200);
    dialog.querySelectorAll('button').forEach((el) => {
      const txt = (el.innerText || '').trim().split('\\n')[0].slice(0, 30);
      const r = el.getBoundingClientRect();
      if (txt !== '' && r.width > 0) out.dialogButtons.push({ txt, sel: el.getAttribute('aria-selected'), cls: String(el.className).slice(0, 40), ...rect(el) });
    });
    const h = dialog.querySelector('h1, h2, h3');
    if (h) out.heading = (h.innerText || '').trim().slice(0, 60);
    return out;
  })()`)
  console.log(JSON.stringify(dump, null, 2).slice(0, 4000))
  proc.kill()
  await sleep(800)
  process.exit(0)
}
main()
