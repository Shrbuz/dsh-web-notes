// Probe the notebook icon content bbox vs its container center.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const PORT = 3080
const CDP_PORT = 9600 + Math.floor(Math.random() * 100)
const browser = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'dshn-bbox-'))
const proc = spawn(browser, ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-sync','--no-sandbox','--force-prefers-reduced-motion',`--user-data-dir=${profile}`,`--remote-debugging-port=${CDP_PORT}`,`http://127.0.0.1:${PORT}/`], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function target() { for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json(); const p = l.find(t => t.type === 'page' && t.url.includes(`:${PORT}`)); if (p) return p } catch {} await sleep(500) } return undefined }
const page = await target()
if (!page) { console.error('no page'); process.exit(1) }
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let seq = 0; const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id !== undefined) { pending.get(m.id)?.(m); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((res) => { seq++; pending.set(seq, res); ws.send(JSON.stringify({ id: seq, method, params })) })
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result?.result?.value }
await send('Runtime.enable')
for (let i = 0; i < 60; i++) { await sleep(1000); if (await ev(`document.querySelector('.dshn-dock svg') !== null`)) break }
console.log(await ev(`(() => {
  const svg = document.querySelector('.dshn-dock svg');
  const dock = document.querySelector('.dshn-dock');
  const bbox = svg.getBBox();               // content bbox in viewBox coords
  const vw = svg.viewBox.baseVal.width, vh = svg.viewBox.baseVal.height;
  const r = dock.getBoundingClientRect();
  const svgR = svg.getBoundingClientRect();
  return JSON.stringify({
    bbox: { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height },
    contentCenter: { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 },
    viewBoxCenter: { x: vw / 2, y: vh / 2 },
    dockCenter: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
    svgCenterInDock: { x: svgR.x + svgR.width / 2 - r.x, y: svgR.y + svgR.height / 2 - r.y },
    svgSize: { w: svgR.width, h: svgR.height },
  });
})()`))
try { ws.close() } catch {} 
try { proc.kill() } catch {}
for (let i = 0; i < 5; i++) { try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); break } catch { await sleep(400) } }
process.exit(0)

