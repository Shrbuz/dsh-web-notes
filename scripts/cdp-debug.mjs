/**
 * Minimal CDP probe: click the notes dock and dump what actually happens.
 * Usage: node scripts/cdp-debug.mjs
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 3080
const CDP_PORT = 9226
const browser = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'dshn-dbg-'))
const proc = spawn(browser, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-sync', '--no-sandbox',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${CDP_PORT}`,
  `http://127.0.0.1:${PORT}/`,
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function target() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page')
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

// wait for dock
let dock = false
for (let i = 0; i < 40 && !dock; i += 1) {
  await sleep(1000)
  dock = await ev(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)
}
console.log('dock mounted:', dock)
console.log('lang:', await ev(`document.documentElement.lang`))
console.log('dock html:', await ev(`document.querySelector('[data-dsh-part="notes-dock"]')?.outerHTML.slice(0, 200)`))
console.log('panel before click:', await ev(`document.querySelector('[data-dsh-notes-panel]') !== null`))

// click via element.click()
await ev(`document.querySelector('[data-dsh-part="notes-dock"]').click()`)
await sleep(1000)
console.log('panel after .click():', await ev(`document.querySelector('[data-dsh-notes-panel]') !== null`))
console.log('panel html:', await ev(`document.querySelector('[data-dsh-notes-panel]')?.outerHTML.slice(0, 300)`))

// click via real mouse through CDP Input domain
const box = await ev(`(() => { const r = document.querySelector('[data-dsh-part="notes-dock"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
console.log('dock box:', JSON.stringify(box))
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
await sleep(1000)
console.log('panel after real click:', await ev(`document.querySelector('[data-dsh-notes-panel]') !== null`))
console.log('body tail:', await ev(`(document.body?.innerText ?? '').slice(-200)`))

// --- insert flow ---
// create a note via API first so the list has an item
const { request } = await import('node:http')
const apiCall = (method, path, body) => new Promise((resolve, reject) => {
  const payload = body === undefined ? null : JSON.stringify(body)
  const req = request({ host: '127.0.0.1', port: PORT, path, method, headers: {
    host: `localhost:${PORT}`, origin: `http://localhost:${PORT}`, 'sec-fetch-site': 'same-origin',
    'content-type': 'application/json', ...(payload === null ? {} : { 'content-length': Buffer.byteLength(payload) }),
  } }, (res) => {
    const chunks = []
    res.on('data', (c) => chunks.push(c))
    res.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { resolve(null) } })
  })
  req.on('error', reject)
  if (payload !== null) req.write(payload)
  req.end()
})
await apiCall('POST', '/api/notes/create', { title: 'debug插入', content: 'debug-insert-content', source: 'manual' })
console.log('note created via api')

// refresh the panel list: close and reopen the panel
await ev(`document.querySelector('[data-dsh-part="notes-dock"]').click()`)
await sleep(600)
await ev(`document.querySelector('[data-dsh-part="notes-dock"]').click()`)
await sleep(1000)
console.log('items:', await ev(`Array.from(document.querySelectorAll('.dshn-item')).map(el => el.textContent.slice(0, 40))`))

// click insert on the item
const clickResult = await ev(`
  (() => {
    const item = Array.from(document.querySelectorAll('.dshn-item')).find(el => el.textContent.includes('debug-insert-content'));
    if (!item) return 'no item';
    const insert = Array.from(item.querySelectorAll('.dshn-action')).find(b => b.textContent.includes('引入') || b.textContent.includes('Insert'));
    if (!insert) return 'no insert btn: ' + Array.from(item.querySelectorAll('.dshn-action')).map(b => b.textContent).join(',');
    insert.click();
    return 'clicked';
  })()
`)
console.log('insert click:', clickResult)
await sleep(800)
console.log('toast:', await ev(`document.querySelector('.dshn-toast')?.textContent ?? 'no toast'`))
console.log('clipboard api:', await ev(`typeof navigator.clipboard`))

// cleanup
const dbgList = await apiCall('GET', '/api/notes/list')
const dbgNote = dbgList?.notes?.find(n => n.title === 'debug插入')
if (dbgNote) await apiCall('POST', '/api/notes/delete', { id: dbgNote.id })
console.log('cleanup done')

try { ws.close() } catch { /* ignore */ }
try { proc.kill() } catch { /* ignore */ }
for (let i = 0; i < 5; i += 1) {
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); break } catch { await sleep(400) }
}
process.exit(0)
