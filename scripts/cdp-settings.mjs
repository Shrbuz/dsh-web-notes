/**
 * End-to-end verification of the notes SETTINGS features (设置 → 插件 →
 * 插件配置): the notes card, the three live controls, and their effect on the
 * floating UI (size presets, pinned mode, default-global). Requires the HOST
 * to have restarted with the extended settings schema (run after
 * verify-live.mjs passes).
 *
 * Usage: node scripts/cdp-settings.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const PORT = 3080
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

const profile = mkdtempSync(join(tmpdir(), 'dshn-set-'))
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

  // Wait for the notes dock to mount.
  let dockSeen = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(1000)
    dockSeen = await evaluate(`document.querySelector('[data-dsh-part="notes-dock"]') !== null`)
    if (dockSeen) break
  }
  check('dock button mounted', dockSeen)

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

  // ---- default placement: floating + large (80 px) ----
  // The dock animates in (scale/opacity), so wait for the size to settle.
  check('dock defaults to floating + large', await waitFor(
    `(() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      if (!dock) return false;
      const r = dock.getBoundingClientRect();
      return dock.getAttribute('data-mode') === 'floating' && dock.getAttribute('data-size') === 'large'
        && Math.round(r.width) === 80 && Math.round(r.height) === 80;
    })()`,
    'dock-default-large',
  ))

  // ---- open the settings surface: sidebar-foot settings trigger → 插件 ----
  const openPluginsSettings = async () => {
    // The settings trigger is the lowest 'trigger'-classed button in the left
    // region (the sidebar foot), regardless of collapsed/expanded state.
    const opened = await evaluate(`(() => {
      const buttons = [...document.querySelectorAll('button')]
        .filter((b) => String(b.className).includes('trigger'))
        .map((b) => ({ b, r: b.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.x < 320 && r.y > window.innerHeight * 0.6)
        .sort((a, b) => b.r.bottom - a.r.bottom);
      const trigger = buttons[0];
      if (!trigger) return false;
      trigger.b.click();
      return true;
    })()`)
    if (!opened) return false
    await sleep(1200)
    // The 插件 nav cell: the left-column button inside the settings dialog.
    // Match BOTH locales — the app follows the document language, and
    // headless Chrome defaults to en-US unless --lang is passed.
    const pluginNav = await evaluate(`(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return false;
      const label = (b) => (b.innerText || '').trim();
      const cell = [...dialog.querySelectorAll('button')]
        .find((b) => (label(b) === '插件' || label(b) === 'Plugins') && b.getBoundingClientRect().x < 250);
      if (!cell) return false;
      cell.click();
      return true;
    })()`)
    await sleep(1200)
    return pluginNav
  }
  check('settings → 插件 opens', await openPluginsSettings())

  // ---- the notes card with its three controls ----
  check('notes settings card rendered', await waitFor(
    `document.querySelector('[data-dsh-part="notes-settings-card"]') !== null`,
    'notes-card',
  ))
  // The card is collapsed by default (official pattern): the header shows the
  // title + description; clicking it expands the form. React updates the
  // aria-expanded asynchronously, so click first, then waitFor the state.
  check('card collapses/expands via header', await evaluate(`(() => {
    const card = document.querySelector('[data-dsh-part="notes-settings-card"]');
    const header = card?.querySelector('.dshn-settings-header');
    if (!card || !header) return false;
    const collapsed = header.getAttribute('aria-expanded') === 'false'
      && card.querySelector('.dshn-settings-body') === null;
    header.click();
    return collapsed;
  })()`))
  check('card expands after header click', await waitFor(
    `(() => {
      const card = document.querySelector('[data-dsh-part="notes-settings-card"]');
      const header = card?.querySelector('.dshn-settings-header');
      return header?.getAttribute('aria-expanded') === 'true'
        && card?.querySelector('.dshn-settings-body') !== null;
    })()`,
    'card-expanded',
  ))
  check('card shows 快捷入口/按钮大小/默认保存全局', await evaluate(
    `(() => {
      const text = document.querySelector('[data-dsh-part="notes-settings-card"]')?.innerText ?? '';
      const zh = text.includes('快捷入口') && text.includes('悬浮按钮大小') && text.includes('默认保存全局');
      const en = text.includes('Quick access') && text.includes('Floating button size') && text.includes('Default save as global');
      return zh || en;
    })()`,
  ))
  check('card has segmented + switch controls', await evaluate(
    `document.querySelector('[data-dsh-part="notes-setting-dockMode"]') !== null
      && document.querySelector('[data-dsh-part="notes-setting-buttonSize"]') !== null
      && document.querySelector('[data-dsh-part="notes-setting-defaultGlobal"]') !== null`,
  ))

  // ---- size preset: 较小 → dock shrinks live to 48 px ----
  // Segmented control: click the option button instead of a native select.
  const clickSeg = (part, value) => evaluate(`(() => {
    const btn = document.querySelector('[data-dsh-part="${part}-${value}"]');
    if (!btn) return false;
    btn.click();
    return true;
  })()`)
  check('set buttonSize small', await clickSeg('notes-setting-buttonSize', 'small'))
  check('dock shrinks to small (48px) live', await waitFor(
    `(() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      if (!dock || dock.getAttribute('data-size') !== 'small') return false;
      const r = dock.getBoundingClientRect();
      return Math.round(r.width) === 48 && Math.round(r.height) === 48;
    })()`,
    'size-small',
  ))

  check('set buttonSize large', await clickSeg('notes-setting-buttonSize', 'large'))
  check('dock restores to large (80px)', await waitFor(
    `(() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      if (!dock || dock.getAttribute('data-size') !== 'large') return false;
      const r = dock.getBoundingClientRect();
      return Math.round(r.width) === 80 && Math.round(r.height) === 80;
    })()`,
    'size-large',
  ))

  // ---- pinned mode: 固定 → dock moves to the conversation top-right ----
  check('set dockMode fixed', await clickSeg('notes-setting-dockMode', 'fixed'))
  const pinned = await waitFor(
    `(() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      return dock !== null && dock.getAttribute('data-mode') === 'fixed';
    })()`,
    'mode-fixed',
  )
  check('dock enters pinned mode', pinned)
  const pinGeom = await evaluate(`(() => {
    const dock = document.querySelector('[data-dsh-part="notes-dock"]');
    const anchor = document.querySelector('[data-conversation-scroll]');
    if (!dock || !anchor) return null;
    const dr = dock.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    return { left: dr.left, top: dr.top, expectLeft: ar.right - 80 - 12, expectTop: ar.top + 12 };
  })()`)
  check('pinned dock sits at conversation top-right', pinGeom !== null
    && Math.abs(pinGeom.left - pinGeom.expectLeft) < 3 && Math.abs(pinGeom.top - pinGeom.expectTop) < 3)

  // ---- default-global preference ----
  check('set defaultGlobal on', await evaluate(`(() => {
    const box = document.querySelector('[data-dsh-part="notes-setting-defaultGlobal"]');
    if (!box || box.checked) return false;
    box.click();
    return true;
  })()`))
  check('defaultGlobal checkbox flips on', await waitFor(
    `document.querySelector('[data-dsh-part="notes-setting-defaultGlobal"]')?.checked === true`,
    'default-global-on',
  ))

  // Close the settings dialog, then verify the editor checkbox defaults ON.
  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => {
    const t = (b.innerText || '').trim();
    return t === '关闭' || t === 'Close';
  })?.click()`)
  await sleep(800)
  check('settings dialog closed', await evaluate(`document.querySelector('[role="dialog"]') === null`))

  // Open the dock panel and start a new note: the checkbox must be pre-checked.
  await evaluate(`
    (() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      const r = dock.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const base = { bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 9, pointerType: 'mouse', isPrimary: true, clientX: cx, clientY: cy };
      dock.dispatchEvent(new PointerEvent('pointerdown', base));
      dock.dispatchEvent(new PointerEvent('pointerup', { ...base, buttons: 0 }));
      dock.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })()
  `)
  check('panel opens', await waitFor(
    `document.querySelector('[data-dsh-notes-panel]') !== null`,
    'panel',
  ))
  await evaluate(`Array.from(document.querySelectorAll('.dshn-new-btn')).find((b) => b.textContent.includes('新建') || b.textContent.includes('New'))?.click()`)
  check('editor opens with global checkbox pre-checked', await waitFor(
    `(() => {
      const box = document.querySelector('.dshn-editor .dshn-check');
      return box !== null && box.checked === true;
    })()`,
    'editor-global-default',
  ))
  // Cancel the draft (nothing saved).
  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => (b.innerText.includes('取消') || b.innerText.includes('Cancel')))?.click()`)
  await evaluate(`Array.from(document.querySelectorAll('.dshn-icon-btn')).find((b) => {
    const label = b.getAttribute('aria-label') || '';
    return label.includes('笔记') || label.includes('Notes') || b.textContent.includes('✕');
  })?.click()`)
  await sleep(300)

  // ---- pinned dock is not draggable ----
  const beforeDrag = await evaluate(`(() => { const r = document.querySelector('[data-dsh-part="notes-dock"]').getBoundingClientRect(); return { x: r.x, y: r.y }; })()`)
  await evaluate(`
    (() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      const r = dock.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const base = { bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 10, pointerType: 'mouse', isPrimary: true, clientX: cx, clientY: cy };
      dock.dispatchEvent(new PointerEvent('pointerdown', base));
      dock.dispatchEvent(new PointerEvent('pointermove', { ...base, clientX: cx + 60, clientY: cy + 40 }));
      dock.dispatchEvent(new PointerEvent('pointerup', { ...base, clientX: cx + 60, clientY: cy + 40, buttons: 0 }));
    })()
  `)
  await sleep(500)
  const afterDrag = await evaluate(`(() => { const r = document.querySelector('[data-dsh-part="notes-dock"]').getBoundingClientRect(); return { x: r.x, y: r.y }; })()`)
  check('pinned dock ignores drag', Math.abs(beforeDrag.x - afterDrag.x) < 2 && Math.abs(beforeDrag.y - afterDrag.y) < 2)
  check('pinned dock writes no drag position', await evaluate(
    `localStorage.getItem('dsh-notes.dock-position') === null`,
  ))

  // ---- restore every preference (settings card again) ----
  check('settings → 插件 reopens', await openPluginsSettings())
  check('card re-expands for restore', await evaluate(`(() => {
    const card = document.querySelector('[data-dsh-part="notes-settings-card"]');
    const header = card?.querySelector('.dshn-settings-header');
    if (!card || !header) return false;
    if (header.getAttribute('aria-expanded') !== 'true') header.click();
    return true;
  })()`))
  check('restore card visible', await waitFor(
    `(() => {
      const card = document.querySelector('[data-dsh-part="notes-settings-card"]');
      const header = card?.querySelector('.dshn-settings-header');
      return header?.getAttribute('aria-expanded') === 'true'
        && card?.querySelector('.dshn-settings-body') !== null;
    })()`,
    'restore-card-expanded',
  ))
  check('set defaultGlobal off', await evaluate(`(() => {
    const box = document.querySelector('[data-dsh-part="notes-setting-defaultGlobal"]');
    if (!box || !box.checked) return false;
    box.click();
    return true;
  })()`))
  check('set dockMode floating', await clickSeg('notes-setting-dockMode', 'floating'))
  check('settings restored to defaults', await waitFor(
    `(() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      if (!dock) return false;
      const r = dock.getBoundingClientRect();
      return dock.getAttribute('data-mode') === 'floating'
        && dock.getAttribute('data-size') === 'large'
        && document.querySelector('[data-dsh-part="notes-setting-defaultGlobal"]')?.checked === false;
    })()`,
    'restored',
  ))
  // Floating placement back at the right edge, vertically centered.
  const floatGeom = await evaluate(`(() => {
    const dock = document.querySelector('[data-dsh-part="notes-dock"]');
    const r = dock.getBoundingClientRect();
    return { right: r.right, top: r.top, h: r.height, vw: window.innerWidth, vh: window.innerHeight };
  })()`)
  check('floating dock back at right edge center', floatGeom !== null
    && Math.abs(floatGeom.right - floatGeom.vw + 10) < 3
    && Math.abs(floatGeom.top + floatGeom.h / 2 - floatGeom.vh / 2) < 3)
  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => {
    const t = (b.innerText || '').trim();
    return t === '关闭' || t === 'Close';
  })?.click()`)
  await sleep(500)

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
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
      break
    } catch { await sleep(500) }
  }
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('CDP settings check threw:', error)
  proc.kill()
  process.exit(1)
})
