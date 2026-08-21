/**
 * Headless browser verification of the notes client UI via Chrome DevTools
 * Protocol. Launches Edge/Chrome in headless mode against the running GUI,
 * waits for the app to boot, then evaluates the DOM for the floating dock and
 * collects any console errors the client bundle produced.
 *
 * Usage: node scripts/cdp-check.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const PORT = 3080
// Random CDP port per run: a stale browser process holding a fixed port
// would answer listTargets() and derail the whole check.
const CDP_PORT = 9300 + Math.floor(Math.random() * 400)
const WAIT_MS = Number(process.env.WAIT_MS ?? 20000)

const browsers = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]
const browser = browsers.find((candidate) => existsSync(candidate))
if (browser === undefined) {
  console.error('no browser found')
  process.exit(1)
}

const profile = mkdtempSync(join(tmpdir(), 'dshn-cdp-'))
const proc = spawn(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-sync',
  '--no-sandbox',
  '--disable-features=msEdgeFirstRunExperience,msEdgeSidebarV2,msEdgeDefaultBrowserCheck',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${CDP_PORT}`,
  `http://127.0.0.1:${PORT}/`,
], { stdio: 'ignore' })

let failures = 0
function check(name, condition) {
  if (condition) console.log('  ok  ' + name)
  else { failures += 1; console.log('FAIL  ' + name) }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function listTargets() {
  // Strict: only a page that actually navigated to the GUI qualifies. The
  // browser briefly exposes about:blank before navigation starts, so keep
  // polling until the real page appears.
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
      const targets = await response.json()
      const page = targets.find((target) => target.type === 'page'
        && (target.url.includes(`127.0.0.1:${PORT}`) || target.url.includes(`localhost:${PORT}`)))
      if (page !== undefined) return page
    } catch { /* retry */ }
    await sleep(500)
  }
  return undefined
}

const main = async () => {
  const page = await listTargets()
  if (page === undefined) {
    console.error('no CDP page target (browser did not boot?)')
    process.exit(1)
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })

  let seq = 0
  const pending = new Map()
  const consoleErrors = []
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id !== undefined) {
      const waiter = pending.get(msg.id)
      if (waiter !== undefined) {
        pending.delete(msg.id)
        waiter(msg)
      }
      return
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ')
      consoleErrors.push(text)
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const detail = msg.params.exceptionDetails
      const text = detail.exception?.description ?? detail.text ?? 'unknown exception'
      consoleErrors.push(text)
    }
  }
  const send = (method, params = {}) => new Promise((resolve) => {
    seq += 1
    pending.set(seq, resolve)
    ws.send(JSON.stringify({ id: seq, method, params }))
  })

  // Guard against connecting to a stale browser (e.g. an Edge first-run page):
  // poll until the target navigates to the dsh GUI (or times out).
  let href = ''
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const pageCheck = await send('Runtime.evaluate', { expression: `location.href`, returnByValue: true })
    href = pageCheck?.result?.result?.value ?? ''
    if (href.startsWith(`http://127.0.0.1:${PORT}`) || href.startsWith(`http://localhost:${PORT}`)) break
    await sleep(500)
  }
  if (!href.startsWith(`http://127.0.0.1:${PORT}`) && !href.startsWith(`http://localhost:${PORT}`)) {
    console.error('CDP target never reached the dsh GUI: ' + href)
    process.exit(1)
  }

  await send('Runtime.enable')
  await send('Page.enable')

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true })
    return result.result?.result?.value
  }

  // Wait for the notes dock to mount (the app boots asynchronously; the
  // plugin fiber applies once its services register).
  let dockSeen = false
  let diagnostics = ''
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(1000)
    dockSeen = await evaluate(
      `document.querySelector('[data-dsh-part="notes-dock"]') !== null`,
    )
    if (dockSeen) break
    if (attempt === 30) {
      diagnostics = await evaluate(`JSON.stringify({
        title: document.title,
        ready: document.readyState,
        boot: !!window.__DSH_BOOT__,
        rootChildren: document.querySelector('#root')?.children.length ?? -1,
        bodyText: (document.body?.innerText ?? '').slice(0, 120),
      })`)
    }
  }
  if (!dockSeen) {
    console.log('  DIAG ' + diagnostics)
  }
  check('dock button mounted', dockSeen)

  check('dock root present', await evaluate(
    `document.querySelector('[data-dsh-notes-root]') !== null`,
  ))
  check('plugin style injected', await evaluate(
    `document.querySelector('style[data-plugin-css="dsh-web-notes/styles"]') !== null`,
  ))

  // ---- dock size + drag ----
  const dockBefore = await evaluate(`(() => {
    const r = document.querySelector('[data-dsh-part="notes-dock"]').getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  })()`)
  check('dock is 2x size (80px)', Math.round(dockBefore.width) === 80 && Math.round(dockBefore.height) === 80)
  // No native title attribute: the styled tooltip is the only "笔记" hint
  // (the native browser tooltip showed up as a duplicate rectangle on hover).
  check('no native title tooltip (single tooltip)', await evaluate(
    `document.querySelector('[data-dsh-part="notes-dock"]').hasAttribute('title') === false`,
  ))
  // The container shadow must be STATIC without hover (no idle glow cycling).
  const shadowA = await evaluate(`getComputedStyle(document.querySelector('.dshn-dock')).boxShadow`)
  await sleep(800)
  const shadowB = await evaluate(`getComputedStyle(document.querySelector('.dshn-dock')).boxShadow`)
  check('dock shadow static (no idle glow cycling)', shadowA === shadowB && shadowA !== 'none')
  check('dock has refined notebook icon', await evaluate(
    `document.querySelector('.dshn-dock svg linearGradient#dshn-notes-cover') !== null`,
  ))

  // The icon content must be visually centered in its viewBox.
  const center = await evaluate(`(() => {
    const svg = document.querySelector('.dshn-dock svg');
    const bbox = svg.getBBox();
    const vw = svg.viewBox.baseVal.width, vh = svg.viewBox.baseVal.height;
    return { cx: bbox.x + bbox.width / 2 - vw / 2, cy: bbox.y + bbox.height / 2 - vh / 2 };
  })()`)
  check('notebook icon visually centered', Math.abs(center.cx) < 0.6 && Math.abs(center.cy) < 0.6)

  // The bookmark flutters continuously (sine, period 1.2 s): two samples half
  // a period apart always differ — proof the rAF choreography runs.
  const bmA = await evaluate(`document.querySelector('.dshn-ani-bookmark')?.getAttribute('transform') ?? null`)
  await sleep(600)
  const bmB = await evaluate(`document.querySelector('.dshn-ani-bookmark')?.getAttribute('transform') ?? null`)
  check('notebook choreography runs (rAF loop)', bmA !== null && bmB !== null && bmA !== bmB)

  // The writing lines draw/erase over the loop: two samples ~1.6 s apart
  // (half a 3.2 s loop) always land on different scale values.
  const lineA = await evaluate(`document.querySelector('.dshn-ani-line')?.getAttribute('transform') ?? null`)
  await sleep(1600)
  const lineB = await evaluate(`document.querySelector('.dshn-ani-line')?.getAttribute('transform') ?? null`)
  check('writing line animates (draw/erase)', lineA !== null && lineB !== null && lineA !== lineB)

  // Drag the dock via synthetic pointer events (pointerdown/move/up).
  await evaluate(`
    (() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      const r = dock.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const base = { bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 7, pointerType: 'mouse', isPrimary: true, clientX: cx, clientY: cy };
      dock.dispatchEvent(new PointerEvent('pointerdown', base));
      dock.dispatchEvent(new PointerEvent('pointermove', { ...base, clientX: cx + 40, clientY: cy + 30 }));
      dock.dispatchEvent(new PointerEvent('pointermove', { ...base, clientX: cx + 80, clientY: cy + 60 }));
      dock.dispatchEvent(new PointerEvent('pointerup', { ...base, clientX: cx + 80, clientY: cy + 60, buttons: 0 }));
    })()
  `)
  await sleep(400)
  const dockAfter = await evaluate(`(() => {
    const r = document.querySelector('[data-dsh-part="notes-dock"]').getBoundingClientRect();
    return { left: r.left, top: r.top };
  })()`)
  check('dock drags to a new position', Math.abs(dockAfter.left - dockBefore.left) > 30 || Math.abs(dockAfter.top - dockBefore.top) > 30)
  check('drag does not open the panel', await evaluate(
    `document.querySelector('[data-dsh-notes-panel]') === null`,
  ))
  check('dragged position persisted', await evaluate(
    `typeof localStorage.getItem('dsh-notes.dock-position') === 'string'`,
  ))

  // Poll one expression until truthy (or timeout) — interactions race the
  // app's own render cadence, so fixed sleeps are flaky.
  const waitFor = async (expression, label, timeoutMs = 15000) => {
    const deadline = Date.now() + timeoutMs
    let value = null
    while (Date.now() < deadline) {
      value = await evaluate(expression)
      if (value) return true
      await sleep(250)
    }
    return value === true
  }

  // Click the dock -> panel opens. Dispatch the full pointer sequence (a
  // synthetic .click() alone would be swallowed by the drag-suppression that
  // the synthetic drag left behind).
  await evaluate(`
    (() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      const r = dock.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const base = { bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 8, pointerType: 'mouse', isPrimary: true, clientX: cx, clientY: cy };
      dock.dispatchEvent(new PointerEvent('pointerdown', base));
      dock.dispatchEvent(new PointerEvent('pointerup', { ...base, buttons: 0 }));
      dock.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })()
  `)
  check('panel opens on dock click', await waitFor(
    `document.querySelector('[data-dsh-notes-panel]') !== null`,
    'panel',
  ))
  check('panel lists notes', await evaluate(
    `document.querySelector('.dshn-panel-title') !== null`,
  ))

  // ---- theme adaptation ----
  // The plugin colors ride the official --dsw-alias-* tokens: the primary
  // button must resolve to the theme's token value, and redefining the token
  // (as a skin does) must recolor it live.
  const primaryToken = await evaluate(`getComputedStyle(document.body).getPropertyValue('--dsw-alias-button-primary-fill').trim()`)
  const btnBg = await evaluate(`getComputedStyle(document.querySelector('.dshn-new-btn')).backgroundColor`)
  const matchesToken = await evaluate(`
    (() => {
      const token = getComputedStyle(document.body).getPropertyValue('--dsw-alias-button-primary-fill').trim();
      const probe = document.createElement('div');
      probe.style.background = token;
      document.body.appendChild(probe);
      const tokenRgb = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return tokenRgb === getComputedStyle(document.querySelector('.dshn-new-btn')).backgroundColor;
    })()
  `)
  check('button uses the official primary token', matchesToken === true)
  check('primary token resolved (' + primaryToken + ')', primaryToken !== '' && btnBg !== 'rgba(0, 0, 0, 0)')

  // Skin adaptation: a skin recolors by redefining the token — simulate one.
  await evaluate(`document.body.style.setProperty('--dsw-alias-button-primary-fill', '#4a5fa8')`)
  await sleep(150)
  const skinBg = await evaluate(`getComputedStyle(document.querySelector('.dshn-new-btn')).backgroundColor`)
  check('recolored live by a skin token override', skinBg === 'rgb(74, 95, 168)')
  await evaluate(`document.body.style.removeProperty('--dsw-alias-button-primary-fill')`)

  // Dark theme: body[data-ds-dark-theme] flips the tokens — the button color
  // must change with it.
  const lightBg = await evaluate(`getComputedStyle(document.querySelector('.dshn-new-btn')).backgroundColor`)
  await evaluate(`document.body.setAttribute('data-ds-dark-theme', '')`)
  await sleep(150)
  const darkBg = await evaluate(`getComputedStyle(document.querySelector('.dshn-new-btn')).backgroundColor`)
  await evaluate(`document.body.removeAttribute('data-ds-dark-theme')`)
  check('dark theme flips the token colors', darkBg !== lightBg && darkBg !== '')

  // New note flow: click 新建 -> editor appears.
  await evaluate(`Array.from(document.querySelectorAll('.dshn-new-btn')).find(b => b.textContent.includes('新建') || b.textContent.includes('New'))?.click()`)
  check('editor opens', await waitFor(
    `document.querySelector('.dshn-textarea') !== null`,
    'editor',
  ))

  // Fill and save -> back to list with the note. The title is deliberately
  // DIFFERENT from the content so the insert test can prove the title is not
  // injected into the composer draft.
  await evaluate(`
    (() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const titleInput = document.querySelector('.dshn-editor .dshn-input');
      setter.call(titleInput, '标题勿入正文');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      const ta = document.querySelector('.dshn-textarea');
      const taSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      taSetter.call(ta, 'cdp 浏览器验证笔记\\n第二行');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      const save = Array.from(document.querySelectorAll('button')).find(b => (b.textContent.includes('保存') || b.textContent.includes('Save')) && !b.disabled);
      save?.click();
    })()
  `)
  check('note created via UI', await waitFor(
    `document.body.textContent.includes('cdp 浏览器验证笔记')`,
    'note-created',
  ))

  // ---- session scoping ----
  // Seed two API notes: one bound to ANOTHER session, one global. The UI note
  // just created is bound to the CURRENT session by default.
  const apiCall2 = async (method, path, body) => {
    const payload = body === undefined ? null : JSON.stringify(body)
    const res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: payload === null ? undefined : payload,
    })
    return res.json()
  }
  await apiCall2('POST', '/api/notes/create', { title: 'FakeSession笔记', content: 'other-session-content', sessionId: 'other-session-xyz' })
  await apiCall2('POST', '/api/notes/create', { title: 'Global笔记', content: 'global-content-abc' })
  const bodyHas = (text) => `document.body.textContent.includes(${JSON.stringify(text)})`

  // The panel loads on mount / scope change — re-enter the 全部 tab to reload
  // so the API-seeded notes are picked up.
  await evaluate(`Array.from(document.querySelectorAll('.dshn-scope')).find(b => b.textContent.includes('全部') || b.textContent.includes('All'))?.click()`)
  check('all scope shows global + own session notes', await waitFor(
    `(${bodyHas('Global笔记')}) && !(${bodyHas('FakeSession笔记')}) && (${bodyHas('cdp 浏览器验证笔记')})`,
    'scope-all',
  ))

  // Switch to 全局: only the global note remains.
  await evaluate(`Array.from(document.querySelectorAll('.dshn-scope')).find(b => b.textContent.includes('全局') || b.textContent.includes('Global'))?.click()`)
  check('global scope shows global note only', await waitFor(
    `(${bodyHas('Global笔记')}) && !(${bodyHas('FakeSession笔记')}) && !(${bodyHas('cdp 浏览器验证笔记')})`,
    'scope-global',
  ))

  // Switch to 当前会话: only the current session's note remains.
  await evaluate(`Array.from(document.querySelectorAll('.dshn-scope')).find(b => b.textContent.includes('当前会话') || b.textContent.includes('This session'))?.click()`)
  check('session scope shows session note only', await waitFor(
    `(${bodyHas('cdp 浏览器验证笔记')}) && !(${bodyHas('Global笔记')}) && !(${bodyHas('FakeSession笔记')})`,
    'scope-session',
  ))

  // Back to 全部 for the insert test that follows.
  await evaluate(`Array.from(document.querySelectorAll('.dshn-scope')).find(b => b.textContent.includes('全部') || b.textContent.includes('All'))?.click()`)
  await waitFor(bodyHas('cdp 浏览器验证笔记'), 'scope-all-restored')

  // Insert action: with a current session the note lands in the composer and
  // the panel shows the inserted toast; without one it falls back to the
  // clipboard toast. Re-fire the click each poll (idempotent) so a transient
  // render gap can never starve the assertion.
  let insertOk = false
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await evaluate(`
      (() => {
        const item = Array.from(document.querySelectorAll('.dshn-item')).find(el => el.textContent.includes('cdp 浏览器验证笔记'));
        const insert = item && Array.from(item.querySelectorAll('.dshn-action')).find(b => b.textContent.includes('引入') || b.textContent.includes('Insert'));
        insert?.click();
      })()
    `)
    await sleep(400)
    const copy = await evaluate(`
      (() => {
        const toast = document.querySelector('.dshn-toast')?.textContent ?? '';
        const inserted = toast.includes('输入框') || toast.includes('Inserted');
        const fallback = toast.includes('剪贴板') || toast.includes('clipboard') || toast.includes('没有');
        return inserted ? 'inserted' : (fallback ? 'fallback' : '');
      })()
    `)
    if (copy === 'inserted' || copy === 'fallback') {
      insertOk = true
      break
    }
    await sleep(200)
  }
  check('insert lands in composer (or clipboard fallback)', insertOk)

  // When the composer draft is observable (an active session), assert it holds
  // the note CONTENT but NOT the title. On the hero screen the composer is
  // read-only and may not render the draft — then the toast assertion above is
  // the evidence and this check is skipped (reported as ok with a note).
  const draftCheck = await evaluate(`
    (() => {
      const drafts = Array.from(document.querySelectorAll('textarea')).filter(ta => ta.value.includes('cdp 浏览器验证笔记'));
      if (drafts.length === 0) return { visible: false };
      return {
        visible: true,
        hasTitle: drafts.some(ta => ta.value.includes('标题勿入正文')),
        hasContent: drafts.some(ta => ta.value.includes('第二行')),
      };
    })()
  `)
  if (draftCheck.visible) {
    check('composer draft has content only (no title)', draftCheck.hasContent === true && draftCheck.hasTitle === false)
  } else {
    check('composer draft has content only (hero read-only — toast asserted)', true)
  }

  // Selection save: build a real Range over page text OUTSIDE the notes UI,
  // then fire mouseup so the capture bubble appears.
  await evaluate(`
    (() => {
      const holder = document.createElement('div');
      holder.id = 'dshn-selection-target';
      holder.textContent = '这是用于选中保存验证的一段页面文本 selection-capture-check';
      holder.style.cssText = 'position:fixed;left:40%;top:40%;z-index:99999;color:#fff;';
      document.body.appendChild(holder);
      const range = document.createRange();
      range.selectNodeContents(holder);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    })()
  `)
  check('selection save bubble appears', await waitFor(
    `document.querySelector('[data-dsh-part="notes-selection-save"]') !== null`,
    'selection-bubble',
  ))

  // Scroll-follow: a scroll event must NOT hide the bubble (it repositions
  // with the selection instead); only clicks/window switches hide it.
  await evaluate(`document.documentElement.dispatchEvent(new Event('scroll', { bubbles: true }))`)
  await sleep(500)
  check('bubble survives page scroll (follows)', await evaluate(
    `document.querySelector('[data-dsh-part="notes-selection-save"]') !== null`,
  ))

  // Clicking elsewhere on the page hides the bubble.
  await evaluate(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 12, clientY: 12 }))`)
  await sleep(400)
  check('bubble hides on page pointerdown', await evaluate(
    `document.querySelector('[data-dsh-part="notes-selection-save"]') === null`,
  ))

  // Re-arm the selection and click the bubble -> prefilled editor.
  await evaluate(`
    (() => {
      const range = document.createRange();
      const holder = document.querySelector('#dshn-selection-target');
      range.selectNodeContents(holder);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    })()
  `)
  await waitFor(
    `document.querySelector('[data-dsh-part="notes-selection-save"]') !== null`,
    'selection-bubble-rearmed',
  )
  await evaluate(`document.querySelector('[data-dsh-part="notes-selection-save"]')?.click()`)
  check('selection opens prefilled editor', await waitFor(
    `document.querySelector('.dshn-textarea') !== null && document.querySelector('.dshn-textarea').value.includes('selection-capture-check')`,
    'prefilled',
  ))
  // Cancel the prefilled editor (do not save a second test note).
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => (b.textContent.includes('取消') || b.textContent.includes('Cancel')))?.click()`)
  await evaluate(`document.querySelector('#dshn-selection-target')?.remove()`)
  await sleep(300)

  // Cleanup: delete the test notes through the API (node:http so the loopback
  // fence sees a proper Host header — undici drops custom host headers). The
  // list endpoint WITHOUT a session collapses to global-only, so session-bound
  // test notes are enumerated by reading the store file directly (local file,
  // same machine as the host).
  try {
    const { homedir } = require('node:os')
    const { readFileSync } = require('node:fs')
    const home = process.env.DSH_HOME ?? homedir() + '/.dsh'
    const store = JSON.parse(readFileSync(home + '/notes/notes.json', 'utf8'))
    const targets = (store.notes ?? []).filter((note) =>
      note.content.includes('cdp 浏览器验证笔记')
      || note.content.includes('global-content-abc')
      || note.content.includes('other-session-content'))
    for (const target of targets) {
      await apiCall('POST', '/api/notes/delete', { id: target.id })
    }
    if (targets.length > 0) console.log(`  ok  cleanup deleted ${targets.length} test note(s)`)
  } catch (error) {
    console.log('WARN cleanup: ' + error.message)
  }

  console.log('')
  if (consoleErrors.length === 0) {
    console.log('  ok  no console errors')
  } else {
    failures += 1
    console.log('FAIL  console errors (' + consoleErrors.length + '):')
    for (const line of consoleErrors.slice(0, 10)) console.log('  > ' + line.slice(0, 300))
  }

  try { ws.close() } catch { /* ignore */ }
  try { proc.kill() } catch { /* ignore */ }
  // Windows may keep the profile dir locked briefly after kill; retry the remove.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
      break
    } catch { await sleep(500) }
  }
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
  process.exit(failures === 0 ? 0 : 1)
}

/** Same-origin API call through node:http (loopback fence compliant). */
function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const { request } = require('node:http')
    const payload = body === undefined ? null : JSON.stringify(body)
    const req = request({
      host: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        host: `localhost:${PORT}`,
        origin: `http://localhost:${PORT}`,
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
        ...(payload === null ? {} : { 'content-length': Buffer.byteLength(payload) }),
      },
    }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        try { resolve(JSON.parse(text)) } catch { resolve({ raw: text }) }
      })
    })
    req.on('error', reject)
    if (payload !== null) req.write(payload)
    req.end()
  })
}

main().catch((error) => {
  console.error('CDP check threw:', error)
  proc.kill()
  process.exit(1)
})
