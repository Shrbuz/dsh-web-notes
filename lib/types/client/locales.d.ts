/**
 * dsh-web-notes locale dictionaries (zh/en) plus the tiny self-contained
 * translation helper. The notes UI mounts as a global floating surface (not a
 * session-scoped slot), so it has no framework locale seat and resolves its
 * copy from the document language — the same approach the pet and task-board
 * floating surfaces use.
 * @module dsh-web-notes/client/locales
 */
/** Dictionary namespace this package registers (informational; the UI reads the dictionary directly). */
export declare const NS = "notes";
/** Chinese copy. */
export declare const zh: {
    readonly 'notes.dock.tooltip': "笔记";
    readonly 'notes.panel.title': "笔记";
    readonly 'notes.panel.new': "新建";
    readonly 'notes.panel.searchPlaceholder': "搜索标题、内容或标签…";
    readonly 'notes.panel.empty': "还没有笔记。点击「新建」记录命令、凭证或参数值，或选中任意文本一键保存。";
    readonly 'notes.panel.emptyTitle': "随手记录，随时调用";
    readonly 'notes.panel.loading': "加载中…";
    readonly 'notes.panel.loadFailed': "笔记加载失败，请刷新重试";
    readonly 'notes.editor.titlePlaceholder': "标题（可选，默认取内容首行）";
    readonly 'notes.editor.contentPlaceholder': "写下命令、凭证、参数值或任何重要的内容…";
    readonly 'notes.editor.tagsPlaceholder': "标签，用逗号分隔（可选）";
    readonly 'notes.editor.save': "保存";
    readonly 'notes.editor.cancel': "取消";
    readonly 'notes.editor.saving': "保存中…";
    readonly 'notes.editor.mdMode': "内容显示方式";
    readonly 'notes.editor.mdEdit': "编辑";
    readonly 'notes.editor.mdPreview': "预览";
    readonly 'notes.editor.deleteConfirm': "确定删除这条笔记吗？";
    readonly 'notes.item.insert': "引入";
    readonly 'notes.item.copy': "复制";
    readonly 'notes.item.edit': "编辑";
    readonly 'notes.item.delete': "删除";
    readonly 'notes.item.inserted': "已放入输入框，回车发送";
    readonly 'notes.item.noSession': "当前没有打开的会话，已复制到剪贴板";
    readonly 'notes.item.copied': "已复制到剪贴板";
    readonly 'notes.item.copyFailed': "复制失败，请手动选择";
    readonly 'notes.item.saved': "笔记已保存";
    readonly 'notes.selection.save': "存为笔记";
    readonly 'notes.selection.saved': "已保存为笔记";
    readonly 'notes.source.selection': "选中保存";
    readonly 'notes.source.composer': "来自输入框";
    readonly 'notes.source.manual': "手动";
    readonly 'notes.scope.all': "全部";
    readonly 'notes.scope.session': "当前会话";
    readonly 'notes.scope.global': "全局";
    readonly 'notes.scope.globalHint': "当前无打开的会话，仅显示全局笔记";
    readonly 'notes.editor.globalOnly': "保存到全局（所有会话可见）";
    readonly 'notes.item.sessionTag': "会话";
    readonly 'notes.item.globalTag': "全局";
    readonly 'notes.settings.title': "笔记";
    readonly 'notes.settings.description': "一键创建笔记和引入笔记内容到对话框。";
    readonly 'notes.settings.expand': "展开设置: 笔记";
    readonly 'notes.settings.collapse': "收起设置: 笔记";
    readonly 'notes.settings.dockMode': "快捷入口";
    readonly 'notes.settings.dockModeFloating': "悬浮";
    readonly 'notes.settings.dockModeFixed': "固定";
    readonly 'notes.settings.buttonSize': "悬浮按钮大小";
    readonly 'notes.settings.buttonSizeSmall': "较小";
    readonly 'notes.settings.buttonSizeRegular': "常规";
    readonly 'notes.settings.buttonSizeLarge': "较大";
    readonly 'notes.settings.defaultGlobal': "默认保存全局";
    readonly 'notes.time.justNow': "刚刚";
    readonly 'notes.time.minutesAgo': "{n} 分钟前";
    readonly 'notes.time.hoursAgo': "{n} 小时前";
    readonly 'notes.time.yesterday': "昨天";
    readonly 'notes.time.daysAgo': "{n} 天前";
    readonly 'notes.confirm.ok': "确定";
    readonly 'notes.confirm.cancel': "取消";
    readonly 'notes.footer.star': "喜欢这个插件？去 GitHub / CNB 点个 Star ⭐";
    readonly 'notes.footer.github': "GitHub";
    readonly 'notes.footer.cnb': "CNB";
};
/** English copy. */
export declare const en: {
    readonly 'notes.dock.tooltip': "Notes";
    readonly 'notes.panel.title': "Notes";
    readonly 'notes.panel.new': "New";
    readonly 'notes.panel.searchPlaceholder': "Search title, content or tags…";
    readonly 'notes.panel.empty': "No notes yet. Click “New” to capture commands, credentials or parameter values, or select any text to save it with one click.";
    readonly 'notes.panel.emptyTitle': "Jot it down, use it anytime";
    readonly 'notes.panel.loading': "Loading…";
    readonly 'notes.panel.loadFailed': "Failed to load notes. Refresh and try again.";
    readonly 'notes.editor.titlePlaceholder': "Title (optional; defaults to the first line)";
    readonly 'notes.editor.contentPlaceholder': "Write down commands, credentials, parameter values or anything important…";
    readonly 'notes.editor.tagsPlaceholder': "Tags, comma separated (optional)";
    readonly 'notes.editor.save': "Save";
    readonly 'notes.editor.cancel': "Cancel";
    readonly 'notes.editor.saving': "Saving…";
    readonly 'notes.editor.mdMode': "Content display";
    readonly 'notes.editor.mdEdit': "Edit";
    readonly 'notes.editor.mdPreview': "Preview";
    readonly 'notes.editor.deleteConfirm': "Delete this note?";
    readonly 'notes.item.insert': "Insert";
    readonly 'notes.item.copy': "Copy";
    readonly 'notes.item.edit': "Edit";
    readonly 'notes.item.delete': "Delete";
    readonly 'notes.item.inserted': "Inserted into the input box — press Enter to send";
    readonly 'notes.item.noSession': "No session is open; copied to the clipboard instead";
    readonly 'notes.item.copied': "Copied to the clipboard";
    readonly 'notes.item.copyFailed': "Copy failed; select the text manually";
    readonly 'notes.item.saved': "Note saved";
    readonly 'notes.selection.save': "Save as note";
    readonly 'notes.selection.saved': "Saved as a note";
    readonly 'notes.source.selection': "Selection";
    readonly 'notes.source.composer': "From composer";
    readonly 'notes.source.manual': "Manual";
    readonly 'notes.scope.all': "All";
    readonly 'notes.scope.session': "This session";
    readonly 'notes.scope.global': "Global";
    readonly 'notes.scope.globalHint': "No session is open; showing global notes only";
    readonly 'notes.editor.globalOnly': "Save as global (visible in every session)";
    readonly 'notes.item.sessionTag': "session";
    readonly 'notes.item.globalTag': "global";
    readonly 'notes.settings.title': "Notes";
    readonly 'notes.settings.description': "Create notes and insert them into the conversation with one click.";
    readonly 'notes.settings.expand': "Expand settings: Notes";
    readonly 'notes.settings.collapse': "Collapse settings: Notes";
    readonly 'notes.settings.dockMode': "Quick access";
    readonly 'notes.settings.dockModeFloating': "Floating";
    readonly 'notes.settings.dockModeFixed': "Pinned";
    readonly 'notes.settings.buttonSize': "Floating button size";
    readonly 'notes.settings.buttonSizeSmall': "Small";
    readonly 'notes.settings.buttonSizeRegular': "Regular";
    readonly 'notes.settings.buttonSizeLarge': "Large";
    readonly 'notes.settings.defaultGlobal': "Default save as global";
    readonly 'notes.time.justNow': "just now";
    readonly 'notes.time.minutesAgo': "{n} min ago";
    readonly 'notes.time.hoursAgo': "{n} h ago";
    readonly 'notes.time.yesterday': "yesterday";
    readonly 'notes.time.daysAgo': "{n} d ago";
    readonly 'notes.confirm.ok': "OK";
    readonly 'notes.confirm.cancel': "Cancel";
    readonly 'notes.footer.star': "Enjoying this plugin? Star it on GitHub / CNB ⭐";
    readonly 'notes.footer.github': "GitHub";
    readonly 'notes.footer.cnb': "CNB";
};
/** Key union for this namespace. */
export type NoteKey = keyof typeof zh;
/** Active dictionary, picked by the document language at call time. */
export declare function dictionary(): Record<NoteKey, string>;
/** Translate a key with optional `{name}` template params; a missing key degrades to the key itself. */
export declare function t(key: string, params?: Record<string, unknown>): string;
/** Relative time label for a timestamp. */
export declare function relativeTime(ts: number, tfn: typeof t): string;
//# sourceMappingURL=locales.d.ts.map