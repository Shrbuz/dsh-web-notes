/**
 * CDP regression for the session-switch bug:
 *   1. Open the notes panel, enter the editor with a draft.
 *   2. Simulate a session switch (change props via the sessions service if
 *      possible; otherwise verify the panel's own session-change effect by
 *      toggling a fake session through window.__notesTestHook if the test
 *      harness provides one — see below).
 *   3. Assert: draft auto-saved against the OLD session, editor closed,
 *      list reloaded for the NEW session.
 *
 * Requires full permissions (headless Chrome). Run with dsh web live on 3080.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 3080
const CDP_PORT = 9600 + Math.floor(Math.random() * 100)
const browsers = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]
const browser = browsers.find((candidate) => existsSync(candidate))
if (browser === undefined) { console.error('no browser'); process.exit(1) }
const profile = mkdtempSync(join(tmpdir(), 'dshn-sessswitch-'))
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

let ws
let msgId = 0
const pending = new Map()

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function connect(wsUrl) {
  ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    }
  }
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const main = async () => {
  const page = await listTargets()
  if (page === undefined) { console.error('page target not found'); cleanup(); process.exit(1) }
  await connect(page.webSocketDebuggerUrl)
  await send('Runtime.enable')
  await send('Page.enable')
  await sleep(3000)

  // Step 1: open the panel.
  const opened = await evaluate(`(() => {
    const btn = document.querySelector('[data-dsh-part="notes-dock"]');
    if (!btn) return false;
    btn.click();
    return true;
  })()`)
  check('open notes panel', opened)
  await sleep(700)

  // Step 2: enter the editor with a draft (via the New button).
  const draftState = await evaluate(`(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const panel = document.querySelector('[data-dsh-notes-panel]');
    if (!panel) return 'no-panel';
    const newBtn = [...panel.querySelectorAll('button')]
      .find((b) => /new|新建/i.test((b.innerText || '').trim()) && b.className.includes('dshn-new'));
    if (!newBtn) return 'no-new-btn';
    newBtn.click();
    await sleep(300);
    const input = panel.querySelector('input.dshn-input');
    const textarea = panel.querySelector('textarea.dshn-input');
    const saveBtn = [...panel.querySelectorAll('button')]
      .find((b) => /save|保存/i.test((b.innerText || '').trim()));
    if (!input || !textarea || !saveBtn) return 'no-editor-fields';
    const setNative = (el, value) => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setNative(input, 'sess-switch-probe');
    setNative(textarea, 'draft body that must auto-save on switch');
    await sleep(150);
    return {
      hasEditor: panel.querySelector('textarea.dshn-input') !== null,
      saveEnabled: !saveBtn.disabled,
      scopeCount: panel.querySelectorAll('.dshn-scope').length,
      hasTestHook: typeof window.__notesSessionSwitchProbe === 'function',
    };
  })()`)
  check('editor open with draft', draftState.hasEditor === true, JSON.stringify(draftState))
  check('save button enabled', draftState.saveEnabled === true)
  check('panel has scope tabs (session context)', draftState.scopeCount >= 2, `count=${draftState.scopeCount}`)

  // Step 3: simulate a session switch. If the page exposes a test hook we use
  // it; otherwise we dispatch a synthetic change on the sessions list is not
  // possible from here, so we report what we can verify statically.
  const hook = await evaluate(`(async () => {
    if (typeof window.__notesSessionSwitchProbe === 'function') {
      const r = await window.__notesSessionSwitchProbe();
      return { used: true, result: r };
    }
    return { used: false };
  })()`)
  check('session-switch test hook used', hook.used === true,
    hook.used ? JSON.stringify(hook.result) : '(no hook — static verification only)')

  // If the hook exists, assert the post-switch state.
  if (hook.used && hook.result) {
    const r = hook.result
    check('draft auto-saved to OLD session', r.savedToOldSession === true, JSON.stringify(r.saved))
    check('editor closed after switch', r.editorClosed === true)
    check('list reloaded for NEW session', r.listForNewSession === true, r.listHint ?? '')
    check('new session has the draft as global?', r.draftGlobalAfterSwitch === false, `global=${r.draftGlobalAfterSwitch}`)
  }

  // Cleanup: remove any probe notes via the API.
  try {
    await evaluate(`(async () => {
      const res = await fetch('/api/notes/list', { headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      const notes = json.notes ?? [];
      for (const n of notes.filter((x) => (x.title || '').startsWith('sess-switch-probe'))) {
        await fetch('/api/notes/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) });
      }
      return true;
    })()`)
  } catch { /* best effort */ }

  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
  cleanup()
  process.exit(failures === 0 ? 0 : 1)
}

function cleanup() {
  try { ws?.close() } catch { /* noop */ }
  try { proc.kill() } catch { /* noop */ }
  try { rmSync(profile, { recursive: true, force: true }) } catch { /* noop */ }
}

process.on('exit', cleanup)
main().catch((err) => { console.error(err); cleanup(); process.exit(1) })
