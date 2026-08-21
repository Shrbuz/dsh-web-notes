/**
 * dsh-web-notes locale dictionaries (zh/en) plus the tiny self-contained
 * translation helper. The notes UI mounts as a global floating surface (not a
 * session-scoped slot), so it has no framework locale seat and resolves its
 * copy from the document language — the same approach the pet and task-board
 * floating surfaces use.
 * @module dsh-web-notes/client/locales
 */

/** Dictionary namespace this package registers (informational; the UI reads the dictionary directly). */
export const NS = 'notes'

/** Chinese copy. */
export const zh = {
  'notes.dock.tooltip': '笔记',
  'notes.panel.title': '笔记',
  'notes.panel.new': '新建',
  'notes.panel.searchPlaceholder': '搜索标题、内容或标签…',
  'notes.panel.empty': '还没有笔记。点击「新建」记录命令、凭证或参数值，或选中任意文本一键保存。',
  'notes.panel.emptyTitle': '随手记录，随时调用',
  'notes.panel.loading': '加载中…',
  'notes.panel.loadFailed': '笔记加载失败，请刷新重试',
  'notes.editor.titlePlaceholder': '标题（可选，默认取内容首行）',
  'notes.editor.contentPlaceholder': '写下命令、凭证、参数值或任何重要的内容…',
  'notes.editor.tagsPlaceholder': '标签，用逗号分隔（可选）',
  'notes.editor.save': '保存',
  'notes.editor.cancel': '取消',
  'notes.editor.saving': '保存中…',
  'notes.editor.mdMode': '内容显示方式',
  'notes.editor.mdEdit': '编辑',
  'notes.editor.mdPreview': '预览',
  'notes.editor.deleteConfirm': '确定删除这条笔记吗？',
  'notes.item.insert': '引入',
  'notes.item.copy': '复制',
  'notes.item.edit': '编辑',
  'notes.item.delete': '删除',
  'notes.item.inserted': '已放入输入框，回车发送',
  'notes.item.noSession': '当前没有打开的会话，已复制到剪贴板',
  'notes.item.copied': '已复制到剪贴板',
  'notes.item.copyFailed': '复制失败，请手动选择',
  'notes.item.saved': '笔记已保存',
  'notes.selection.save': '存为笔记',
  'notes.selection.saved': '已保存为笔记',
  'notes.source.selection': '选中保存',
  'notes.source.composer': '来自输入框',
  'notes.source.manual': '手动',
  'notes.scope.all': '全部',
  'notes.scope.session': '当前会话',
  'notes.scope.global': '全局',
  'notes.scope.globalHint': '当前无打开的会话，仅显示全局笔记',
  'notes.editor.globalOnly': '保存到全局（所有会话可见）',
  'notes.item.sessionTag': '会话',
  'notes.item.globalTag': '全局',
  'notes.settings.title': '笔记',
  'notes.settings.description': '一键创建笔记和引入笔记内容到对话框。',
  'notes.settings.expand': '展开设置: 笔记',
  'notes.settings.collapse': '收起设置: 笔记',
  'notes.settings.dockMode': '快捷入口',
  'notes.settings.dockModeFloating': '悬浮',
  'notes.settings.dockModeFixed': '固定',
  'notes.settings.buttonSize': '悬浮按钮大小',
  'notes.settings.buttonSizeSmall': '较小',
  'notes.settings.buttonSizeRegular': '常规',
  'notes.settings.buttonSizeLarge': '较大',
  'notes.settings.defaultGlobal': '默认保存全局',
  'notes.time.justNow': '刚刚',
  'notes.time.minutesAgo': '{n} 分钟前',
  'notes.time.hoursAgo': '{n} 小时前',
  'notes.time.yesterday': '昨天',
  'notes.time.daysAgo': '{n} 天前',
  'notes.confirm.ok': '确定',
  'notes.confirm.cancel': '取消',
  'notes.footer.star': '喜欢这个插件？去 GitHub / CNB 点个 Star ⭐',
  'notes.footer.github': 'GitHub',
  'notes.footer.cnb': 'CNB',
} as const

/** English copy. */
export const en = {
  'notes.dock.tooltip': 'Notes',
  'notes.panel.title': 'Notes',
  'notes.panel.new': 'New',
  'notes.panel.searchPlaceholder': 'Search title, content or tags…',
  'notes.panel.empty': 'No notes yet. Click “New” to capture commands, credentials or parameter values, or select any text to save it with one click.',
  'notes.panel.emptyTitle': 'Jot it down, use it anytime',
  'notes.panel.loading': 'Loading…',
  'notes.panel.loadFailed': 'Failed to load notes. Refresh and try again.',
  'notes.editor.titlePlaceholder': 'Title (optional; defaults to the first line)',
  'notes.editor.contentPlaceholder': 'Write down commands, credentials, parameter values or anything important…',
  'notes.editor.tagsPlaceholder': 'Tags, comma separated (optional)',
  'notes.editor.save': 'Save',
  'notes.editor.cancel': 'Cancel',
  'notes.editor.saving': 'Saving…',
  'notes.editor.mdMode': 'Content display',
  'notes.editor.mdEdit': 'Edit',
  'notes.editor.mdPreview': 'Preview',
  'notes.editor.deleteConfirm': 'Delete this note?',
  'notes.item.insert': 'Insert',
  'notes.item.copy': 'Copy',
  'notes.item.edit': 'Edit',
  'notes.item.delete': 'Delete',
  'notes.item.inserted': 'Inserted into the input box — press Enter to send',
  'notes.item.noSession': 'No session is open; copied to the clipboard instead',
  'notes.item.copied': 'Copied to the clipboard',
  'notes.item.copyFailed': 'Copy failed; select the text manually',
  'notes.item.saved': 'Note saved',
  'notes.selection.save': 'Save as note',
  'notes.selection.saved': 'Saved as a note',
  'notes.source.selection': 'Selection',
  'notes.source.composer': 'From composer',
  'notes.source.manual': 'Manual',
  'notes.scope.all': 'All',
  'notes.scope.session': 'This session',
  'notes.scope.global': 'Global',
  'notes.scope.globalHint': 'No session is open; showing global notes only',
  'notes.editor.globalOnly': 'Save as global (visible in every session)',
  'notes.item.sessionTag': 'session',
  'notes.item.globalTag': 'global',
  'notes.settings.title': 'Notes',
  'notes.settings.description': 'Create notes and insert them into the conversation with one click.',
  'notes.settings.expand': 'Expand settings: Notes',
  'notes.settings.collapse': 'Collapse settings: Notes',
  'notes.settings.dockMode': 'Quick access',
  'notes.settings.dockModeFloating': 'Floating',
  'notes.settings.dockModeFixed': 'Pinned',
  'notes.settings.buttonSize': 'Floating button size',
  'notes.settings.buttonSizeSmall': 'Small',
  'notes.settings.buttonSizeRegular': 'Regular',
  'notes.settings.buttonSizeLarge': 'Large',
  'notes.settings.defaultGlobal': 'Default save as global',
  'notes.time.justNow': 'just now',
  'notes.time.minutesAgo': '{n} min ago',
  'notes.time.hoursAgo': '{n} h ago',
  'notes.time.yesterday': 'yesterday',
  'notes.time.daysAgo': '{n} d ago',
  'notes.confirm.ok': 'OK',
  'notes.confirm.cancel': 'Cancel',
  'notes.footer.star': 'Enjoying this plugin? Star it on GitHub / CNB ⭐',
  'notes.footer.github': 'GitHub',
  'notes.footer.cnb': 'CNB',
} as const

/** Key union for this namespace. */
export type NoteKey = keyof typeof zh

/** Active dictionary, picked by the document language at call time. */
export function dictionary(): Record<NoteKey, string> {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'zh'
  return lang.toLowerCase().startsWith('en') ? en : zh
}

/** Translate a key with optional `{name}` template params; a missing key degrades to the key itself. */
export function t(key: string, params?: Record<string, unknown>): string {
  let text: string = (dictionary() as Record<string, string>)[key] ?? key
  if (params !== undefined) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

/** Relative time label for a timestamp. */
export function relativeTime(ts: number, tfn: typeof t): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return tfn('notes.time.justNow')
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return tfn('notes.time.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return tfn('notes.time.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return tfn('notes.time.yesterday')
  return tfn('notes.time.daysAgo', { n: days })
}
