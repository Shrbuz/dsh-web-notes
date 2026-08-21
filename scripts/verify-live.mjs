/**
 * Live verification against a running dsh web instance — probes the notes
 * API, the client bundle serving, and the boot graph WITHOUT touching the
 * browser. Run AFTER the host restarts:
 *
 *   node scripts/verify-live.mjs [port]
 *
 * Sends loopback-compatible headers (Host + same-origin markers) so the
 * routes' loopback fence lets it through.
 */
import { request } from 'node:http'

const port = Number(process.argv[2] ?? 3080)
const base = `http://127.0.0.1:${port}`
let failures = 0

function check(name, condition) {
  if (condition) {
    console.log('  ok  ' + name)
  } else {
    failures += 1
    console.log('FAIL  ' + name)
  }
}

function call(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body)
    const req = request({
      host: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        host: `localhost:${port}`,
        origin: `http://localhost:${port}`,
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
        ...(payload === null ? {} : { 'content-length': Buffer.byteLength(payload) }),
      },
    }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve({ status: res.statusCode, text })
      })
    })
    req.on('error', reject)
    if (payload !== null) req.write(payload)
    req.end()
  })
}

const main = async () => {
  console.log(`verifying against ${base} …`)

  // 1. boot graph includes the plugin row
  try {
    const index = await call('GET', '/')
    check('index served', index.status === 200)
    check('boot graph has dsh-web-notes', index.text.includes('"dsh-web-notes"'))
  } catch (error) {
    check('index served (' + error.message + ')', false)
  }

  // 2. client bundle served
  try {
    const bundle = await call('GET', '/plugins/dsh-web-notes/client.js')
    check('client bundle served', bundle.status === 200 && bundle.text.includes('__ModuleLoader__.load'))
  } catch (error) {
    check('client bundle served (' + error.message + ')', false)
  }

  // 3. host API: state
  try {
    const state = await call('GET', '/api/notes/state')
    const parsed = JSON.parse(state.text)
    check('state ok', state.status === 200 && parsed.enabled === true && typeof parsed.selectionCapture === 'boolean')
    check('state exposes UI preferences', parsed.dockMode === 'floating' && parsed.buttonSize === 'large' && parsed.defaultGlobal === false)
  } catch (error) {
    check('state ok (' + error.message + ')', false)
  }

  // 4. host API: create -> list -> update -> delete round trip
  let noteId = null
  try {
    const created = await call('POST', '/api/notes/create', {
      title: '验证笔记',
      content: 'loopback verify note\nsecond line',
      tags: ['verify', 'temp'],
      source: 'selection',
    })
    const parsed = JSON.parse(created.text)
    check('create ok', created.status === 200 && parsed.ok === true)
    noteId = parsed.ok ? parsed.value.id : null
    check('create title kept', parsed.ok && parsed.value.title === '验证笔记')

    const listed = await call('GET', '/api/notes/list')
    const listParsed = JSON.parse(listed.text)
    check('list has note', listParsed.notes.some((n) => n.id === noteId))

    const updated = await call('POST', '/api/notes/update', { id: noteId, title: '验证笔记-改' })
    const updateParsed = JSON.parse(updated.text)
    check('update ok', updateParsed.ok && updateParsed.value.title === '验证笔记-改')

    const removed = await call('POST', '/api/notes/delete', { id: noteId })
    const removeParsed = JSON.parse(removed.text)
    check('delete ok', removeParsed.ok && removeParsed.value.removed === true)
  } catch (error) {
    check('crud round trip (' + error.message + ')', false)
  }

  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
