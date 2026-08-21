/**
 * Standalone host-logic smoke test — runs WITHOUT the dsh web app: builds a
 * bare cordis Context and drives the NotesService + persistence directly.
 * Usage: node scripts/smoke-host.mjs <tmpDir>
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// The built host half is ESM (lib/index.js). Import it dynamically.
const mod = await import(pathToFileURL(join(__dirname, '..', 'lib', 'index.js')).href)
const { NotesService } = mod

// A bare cordis Context.
const { Context } = require('@deepseek-ai/cordis')

const dir = mkdtempSync(join(tmpdir(), 'dsh-notes-smoke-'))
let failures = 0
function check(name, condition) {
  if (condition) {
    console.log('  ok  ' + name)
  } else {
    failures += 1
    console.log('FAIL  ' + name)
  }
}

try {
  const ctx = new Context()
  const service = new NotesService(ctx, { persistDir: dir, enabled: true, selectionCapture: true })

  check('empty store', service.list().length === 0)
  check('count 0', service.count() === 0)

  // create
  const created = service.create({ title: '部署命令', content: 'pnpm install && pnpm build', tags: ['dev', 'build'], source: 'manual' })
  check('create ok', created.ok === true)
  const note = created.ok ? created.value : null
  check('note id present', note !== null && note.id.length > 0)
  check('note title kept', note?.title === '部署命令')
  check('note tags sanitized', Array.isArray(note?.tags) && note.tags.includes('dev'))
  check('note source', note?.source === 'manual')
  check('list has 1', service.list().length === 1)

  // title fallback from content
  const autoTitle = service.create({ content: '第一行是标题\n第二行是内容', source: 'selection' })
  check('auto title from first line', autoTitle.ok && autoTitle.value.title === '第一行是标题')

  // empty content rejected
  const bad = service.create({ content: '   ' })
  check('empty content rejected', bad.ok === false)

  // search
  check('search hits', service.list('pnpm').length === 1)
  check('search miss', service.list('zzz').length === 0)

  // ---- session scoping ----
  const sA = service.create({ content: '会话A的部署笔记', sessionId: 'sess-A' })
  const sB = service.create({ content: '会话B的凭证笔记', sessionId: 'sess-B' })
  check('session note created', sA.ok && sB.ok)
  check('session note carries sessionId', sA.ok && sA.value.sessionId === 'sess-A')
  check('session A sees own notes', service.list(undefined, { sessionId: 'sess-A', scope: 'session' }).length === 1
    && service.list(undefined, { sessionId: 'sess-A', scope: 'session' })[0]?.sessionId === 'sess-A')
  check('session A does not see B notes', service.list(undefined, { sessionId: 'sess-A', scope: 'session' }).every(n => n.sessionId !== 'sess-B'))
  check('session B sees own notes', service.list(undefined, { sessionId: 'sess-B', scope: 'session' }).length === 1)
  check('global scope excludes session notes', service.list(undefined, { sessionId: 'sess-A', scope: 'global' }).every(n => n.sessionId === undefined))
  check('all scope = own + global', service.list(undefined, { sessionId: 'sess-A', scope: 'all' }).length === 3) // 2 global + A
  check('no context shows global only', service.list(undefined, { scope: 'all' }).every(n => n.sessionId === undefined))
  check('global note visible in any session', service.list(undefined, { sessionId: 'sess-A', scope: 'all' }).some(n => n.sessionId === undefined))
  // move a session note to global via update
  const moved = service.update(sA.ok ? sA.value.id : 'x', { sessionId: null })
  check('update clears session binding', moved.ok && moved.value.sessionId === undefined)
  check('moved note now global', service.list(undefined, { sessionId: 'sess-A', scope: 'session' }).every(n => n.sessionId !== (sA.ok ? sA.value.id : '')))
  check('moved note in global pool', service.list(undefined, { scope: 'global' }).some(n => n.id === (sA.ok ? sA.value.id : '')))

  // update
  const updated = service.update(note.id, { title: '构建命令', tags: ['ci'] })
  check('update ok', updated.ok && updated.value.title === '构建命令')
  check('update tags replaced', updated.ok && updated.value.tags.length === 1 && updated.value.tags[0] === 'ci')

  // persistence survives a reload
  const service2 = new NotesService(new Context(), { persistDir: dir })
  check('reload keeps notes', service2.list(undefined, { sessionId: 'sess-B', scope: 'all' }).length === 4)
  check('reload keeps updated title', service2.get(note.id)?.title === '构建命令')
  check('reload keeps session bindings', service2.list(undefined, { sessionId: 'sess-B', scope: 'session' }).length === 1)

  // the persisted file is on disk
  const raw = readFileSync(join(dir, 'notes.json'), 'utf8')
  const parsed = JSON.parse(raw)
  check('notes.json on disk', Array.isArray(parsed.notes) && parsed.notes.length === 4)

  // remove
  const removed = service2.remove(note.id)
  check('remove ok', removed.ok && removed.value.removed === true)
  check('remove unknown fails', service2.remove('nope').ok === false)

  // settings section
  const section = service2.settingsSection()
  check('settings defaults', section.enabled === true && section.selectionCapture === true
    && section.dockMode === 'floating' && section.buttonSize === 'large' && section.defaultGlobal === false)
  service2.applySettingsSection({ enabled: false, selectionCapture: false, dockMode: 'fixed', buttonSize: 'small', defaultGlobal: true })
  check('settings applied', service2.isEnabled() === false && service2.isSelectionCaptureEnabled() === false
    && service2.dockPlacement() === 'fixed' && service2.dockSize() === 'small' && service2.isDefaultGlobal() === true)
  // config defaults also feed the section
  const serviceCfg = new NotesService(new Context(), { persistDir: dir, dockMode: 'fixed', buttonSize: 'regular' })
  check('config defaults flow into section', serviceCfg.settingsSection().dockMode === 'fixed' && serviceCfg.settingsSection().buttonSize === 'regular')

  // clear
  const cleared = service2.clear()
  check('clear ok', cleared.ok && cleared.value.cleared === 3) // one note was removed above
  check('store empty after clear', service2.list().length === 0)

  // corrupt file tolerant read
  const { writeFileSync } = await import('node:fs')
  writeFileSync(join(dir, 'notes.json'), '{not-json', 'utf8')
  const service3 = new NotesService(new Context(), { persistDir: dir })
  check('corrupt file tolerated', service3.list().length === 0)

  ctx.dispose?.()
} catch (error) {
  failures += 1
  console.error('THREW:', error)
} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
