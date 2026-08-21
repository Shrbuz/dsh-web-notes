/**
 * Read the live theme variables + skin markers from the running GUI.
 * Usage: node scripts/theme-probe.mjs
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 3080
const CDP_PORT = 9320 + Math.floor(Math.random() * 100)
const browser = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'dshn-theme-'))
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--no-sandbox',
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
  if (r.result?.exceptionDetails) return 'EXC: ' + (r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text)
  return r.result?.result?.value
}

await send('Runtime.enable')
await sleep(15000)

console.log('=== body dataset (skin markers) ===')
console.log(await ev(`JSON.stringify(document.body.dataset)`))
console.log('=== ALL body attributes ===')
console.log(await ev(`Array.from(document.body.attributes).map(a => a.name + '=' + a.value).join(', ')`))
console.log('=== html attributes ===')
console.log(await ev(`Array.from(document.documentElement.attributes).map(a => a.name + '=' + a.value).join(', ')`))
console.log('=== resolved --dsw-alias-* on BODY ===')
const vars = await ev(`(() => {
  const cs = getComputedStyle(document.body);
  const out = {};
  for (const name of ['--dsw-alias-bg-base','--dsw-alias-bg-layer-1','--dsw-alias-bg-layer-2','--dsw-alias-bg-overlay','--dsw-alias-label-primary','--dsw-alias-label-primary-inverted','--dsw-alias-label-secondary','--dsw-alias-label-tertiary','--dsw-alias-label-caption','--dsw-alias-label-dimmed','--dsw-alias-border-l1','--dsw-alias-border-l2','--dsw-alias-border-l3','--dsw-alias-brand-primary','--dsw-alias-button-primary-fill','--dsw-alias-button-primary-hover','--dsw-alias-button-contrast-fill','--dsw-alias-interactive-bg-hover','--dsw-alias-interactive-bg-active','--dsw-alias-state-error-primary','--dsw-alias-state-success-primary','--dsw-alias-state-warn-primary','--dsw-alias-tooltip-bg','--dsw-alias-markdown-inline-code','--dsw-alias-markdown-code-block','--dsw-alias-scrollbar-bg-l2','--dsw-alias-scrollbar-hover-l2','--dsw-alias-bg-mask-1','--dsw-alias-bg-mask-2','--dsw-alias-bg-mask-3']) {
    out[name] = cs.getPropertyValue(name).trim();
  }
  return JSON.stringify(out);
})()`)
console.log(vars)
console.log('=== body background/color computed ===')
console.log(await ev(`JSON.stringify({ bg: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color })`))
console.log('=== any style[data-skin] or skin style tags ===')
console.log(await ev(`Array.from(document.querySelectorAll('style')).map(s => s.dataset.skin ?? s.dataset.plugin ?? s.id ?? 'plain').join(', ')`))

console.log('=== theme plugin style tag content ===')
console.log(await ev(`(() => {
  const tags = Array.from(document.querySelectorAll('style')).filter(s => s.dataset.plugin === '@deepseek-ai/dsh-client-ui-theme');
  return tags.map((t, i) => '--- tag ' + i + ' (' + t.textContent.length + ' chars) ---\\n' + t.textContent.slice(0, 4000)).join('\\n');
})()`))

try { ws.close() } catch { /* ignore */ }
try { proc.kill() } catch { /* ignore */ }
for (let i = 0; i < 5; i += 1) {
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); break } catch { await sleep(400) }
}
process.exit(0)
