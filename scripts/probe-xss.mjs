/** Debug: dump the XSS preview HTML. */
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
const profile = mkdtempSync(join(tmpdir(), 'dshn-xss-'))
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
    if (await evaluate(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)) break
  }
  const xss = ['# 标题', '', '<script>window.__dshnXss = 1</script>', '', '<img src=x onerror="window.__dshnXss = 2">'].join('\n')
  await evaluate(`
    (() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      const r = dock.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const base = { bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 12, pointerType: 'mouse', isPrimary: true, clientX: cx, clientY: cy };
      dock.dispatchEvent(new PointerEvent('pointerdown', base));
      dock.dispatchEvent(new PointerEvent('pointerup', { ...base, buttons: 0 }));
      dock.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })()
  `)
  await sleep(1500)
  await evaluate(`Array.from(document.querySelectorAll('.dshn-new-btn')).find((b) => b.textContent.includes('新建') || b.textContent.includes('New'))?.click()`)
  await sleep(800)
  await evaluate(`(() => {
    const ta = document.querySelector('.dshn-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(xss)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  await sleep(400)
  await evaluate(`document.querySelector('[data-dsh-part="notes-md-preview-toggle"]')?.click()`)
  await sleep(600)
  const html = await evaluate(`document.querySelector('.dshn-md-body')?.innerHTML ?? 'NO PREVIEW'`)
  console.log('XSS PREVIEW HTML:', JSON.stringify(html))
  proc.kill()
  await sleep(800)
  process.exit(0)
}
main()
