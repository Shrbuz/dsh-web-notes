/**
 * End-to-end verification of the Markdown preview feature: the note editor
 * auto-detects MD text, shows an 编辑/预览 toggle, and renders a sanitized
 * preview. Client-only — no host restart needed.
 *
 * Usage: node scripts/cdp-md.mjs
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
if (browser === undefined) {
  console.error('no browser found')
  process.exit(1)
}

const profile = mkdtempSync(join(tmpdir(), 'dshn-md-'))
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

  // Open the panel and start a new note.
  await evaluate(`
    (() => {
      const dock = document.querySelector('[data-dsh-part="notes-dock"]');
      const r = dock.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const base = { bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 11, pointerType: 'mouse', isPrimary: true, clientX: cx, clientY: cy };
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
  check('editor opens', await waitFor(
    `document.querySelector('.dshn-textarea') !== null`,
    'editor',
  ))

  const setContent = (text) => evaluate(`(() => {
    const ta = document.querySelector('.dshn-textarea');
    if (!ta) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(text)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)

  // Plain prose must NOT trigger the toggle.
  check('set plain text', await setContent('这是一条普通笔记，没有任何标记语法。'))
  await sleep(300)
  check('plain text has no preview toggle', await evaluate(
    `document.querySelector('[data-dsh-part="notes-md-edit"]') === null`,
  ))

  // Markdown content triggers the toggle.
  const md = [
    '# 部署说明',
    '',
    '- 拉取代码',
    '- 安装依赖',
    '',
    '```bash',
    'pnpm build',
    '```',
    '',
    '> 生产环境注意备份',
  ].join('\n')
  check('set markdown text', await setContent(md))
  check('markdown shows preview toggle', await waitFor(
    `document.querySelector('[data-dsh-part="notes-md-edit"]') !== null`,
    'md-toggle',
  ))

  // Preview renders the Markdown: h1, list items, code block, blockquote.
  await evaluate(`document.querySelector('[data-dsh-part="notes-md-preview-toggle"]')?.click()`)
  check('preview pane renders', await waitFor(
    `document.querySelector('[data-dsh-part="notes-md-preview"]') !== null`,
    'md-preview',
  ))
  check('preview h1 rendered', await evaluate(
    `(() => {
      const h1 = document.querySelector('.dshn-md-body h1');
      return h1 !== null && (h1.textContent || '').trim() === '部署说明';
    })()`,
  ))
  check('preview list rendered', await evaluate(
    `(() => {
      const items = [...document.querySelectorAll('.dshn-md-body li')].map((li) => (li.textContent || '').trim());
      return items.includes('拉取代码') && items.includes('安装依赖');
    })()`,
  ))
  check('preview code block rendered', await evaluate(
    `(() => {
      const pre = document.querySelector('.dshn-md-body pre code');
      return pre !== null && (pre.textContent || '').includes('pnpm build');
    })()`,
  ))
  check('preview blockquote rendered', await evaluate(
    `(() => {
      const q = document.querySelector('.dshn-md-body blockquote');
      return q !== null && (q.textContent || '').includes('生产环境注意备份');
    })()`,
  ))

  // The raw markdown is NOT dumped as text into the preview (h1 not "# 部署说明").
  check('preview shows rendered (not raw) markdown', await evaluate(
    `document.querySelector('.dshn-md-body')?.innerText.includes('# 部署说明') !== true`,
  ))

  // Switch back to edit: the draft is intact.
  await evaluate(`document.querySelector('[data-dsh-part="notes-md-edit"]')?.click()`)
  check('back to edit keeps draft', await waitFor(
    `(() => {
      const ta = document.querySelector('.dshn-textarea');
      return ta !== null && ta.value.includes('pnpm build') && ta.value.startsWith('# 部署说明');
    })()`,
    'md-edit-restored',
  ))

  // XSS guard: raw HTML in the note must not execute/leak into the DOM.
  const xss = [
    '# 标题',
    '',
    '<script>window.__dshnXss = 1</script>',
    '',
    '<img src=x onerror="window.__dshnXss = 2">',
  ].join('\n')
  check('set xss text', await setContent(xss))
  await sleep(200)
  await evaluate(`document.querySelector('[data-dsh-part="notes-md-preview-toggle"]')?.click()`)
  await waitFor(`document.querySelector('[data-dsh-part="notes-md-preview"]') !== null`, 'xss-preview')
  check('script tag stripped from preview', await evaluate(
    `(() => {
      const body = document.querySelector('.dshn-md-body');
      return body !== null
        && body.querySelector('script') === null
        && !body.innerHTML.includes('onerror')
        && !body.innerHTML.includes('onload')
        && window.__dshnXss === undefined;
    })()`,
  ))

  // Cancel the draft — nothing saved.
  await evaluate(`Array.from(document.querySelectorAll('button')).find((b) => (b.innerText.includes('取消') || b.innerText.includes('Cancel')))?.click()`)
  await sleep(300)

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
  console.error('CDP md check threw:', error)
  proc.kill()
  process.exit(1)
})
