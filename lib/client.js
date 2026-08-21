window.__ModuleLoader__.load({
	id: "dsh-web-notes",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom_client = require("react-dom/client");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/api.ts
		/** Same-origin JSON fetch helper (GET without body, POST with JSON body). */
		async function notesFetch(path, body) {
			const response = await fetch(path, body === void 0 ? {} : {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			});
			if (!response.ok) throw new Error("notes " + path + " failed: " + response.status);
			return await response.json();
		}
		/** The live API instance (failures surface per call). */
		function createNotesApi() {
			return {
				state: () => notesFetch("/api/notes/state"),
				list: (query, opts) => {
					const params = new URLSearchParams();
					if (query !== void 0 && query.trim() !== "") params.set("q", query.trim());
					if (typeof opts?.session === "string" && opts.session !== "") params.set("session", opts.session);
					if (opts?.scope !== void 0 && opts.scope !== "all") params.set("scope", opts.scope);
					const suffix = params.toString();
					return notesFetch("/api/notes/list" + (suffix === "" ? "" : "?" + suffix));
				},
				create: (input) => notesFetch("/api/notes/create", input),
				update: (id, patch) => notesFetch("/api/notes/update", {
					id,
					...patch
				}),
				remove: (id) => notesFetch("/api/notes/delete", { id })
			};
		}
		//#endregion
		//#region src/client/locales.ts
		/** Chinese copy. */
		const zh = {
			"notes.dock.tooltip": "笔记",
			"notes.panel.title": "笔记",
			"notes.panel.new": "新建",
			"notes.panel.searchPlaceholder": "搜索标题、内容或标签…",
			"notes.panel.empty": "还没有笔记。点击「新建」记录命令、凭证或参数值，或选中任意文本一键保存。",
			"notes.panel.loading": "加载中…",
			"notes.panel.loadFailed": "笔记加载失败，请刷新重试",
			"notes.editor.titlePlaceholder": "标题（可选，默认取内容首行）",
			"notes.editor.contentPlaceholder": "写下命令、凭证、参数值或任何重要的内容…",
			"notes.editor.tagsPlaceholder": "标签，用逗号分隔（可选）",
			"notes.editor.save": "保存",
			"notes.editor.cancel": "取消",
			"notes.editor.saving": "保存中…",
			"notes.editor.mdMode": "内容显示方式",
			"notes.editor.mdEdit": "编辑",
			"notes.editor.mdPreview": "预览",
			"notes.editor.deleteConfirm": "确定删除这条笔记吗？",
			"notes.item.insert": "引入",
			"notes.item.copy": "复制",
			"notes.item.edit": "编辑",
			"notes.item.delete": "删除",
			"notes.item.inserted": "已放入输入框，回车发送",
			"notes.item.noSession": "当前没有打开的会话，已复制到剪贴板",
			"notes.item.copied": "已复制到剪贴板",
			"notes.item.copyFailed": "复制失败，请手动选择",
			"notes.item.saved": "笔记已保存",
			"notes.selection.save": "存为笔记",
			"notes.selection.saved": "已保存为笔记",
			"notes.source.selection": "选中保存",
			"notes.source.composer": "来自输入框",
			"notes.source.manual": "手动",
			"notes.scope.all": "全部",
			"notes.scope.session": "当前会话",
			"notes.scope.global": "全局",
			"notes.scope.globalHint": "当前无打开的会话，仅显示全局笔记",
			"notes.editor.globalOnly": "保存到全局（所有会话可见）",
			"notes.item.sessionTag": "会话",
			"notes.item.globalTag": "全局",
			"notes.settings.title": "笔记",
			"notes.settings.description": "快捷入口、按钮大小与新建笔记的默认作用域。",
			"notes.settings.dockMode": "快捷入口",
			"notes.settings.dockModeFloating": "悬浮（可拖动）",
			"notes.settings.dockModeFixed": "固定（对话窗口右上角）",
			"notes.settings.dockModeHint": "悬浮：右边缘可自由拖动；固定：钉在对话窗口右上角，不可拖动。",
			"notes.settings.buttonSize": "悬浮按钮大小",
			"notes.settings.buttonSizeSmall": "较小",
			"notes.settings.buttonSizeRegular": "常规",
			"notes.settings.buttonSizeLarge": "较大",
			"notes.settings.defaultGlobal": "默认保存全局",
			"notes.settings.defaultGlobalHint": "新建笔记默认保存到全局（所有会话可见）。",
			"notes.time.justNow": "刚刚",
			"notes.time.minutesAgo": "{n} 分钟前",
			"notes.time.hoursAgo": "{n} 小时前",
			"notes.time.yesterday": "昨天",
			"notes.time.daysAgo": "{n} 天前",
			"notes.confirm.ok": "确定",
			"notes.confirm.cancel": "取消"
		};
		/** English copy. */
		const en = {
			"notes.dock.tooltip": "Notes",
			"notes.panel.title": "Notes",
			"notes.panel.new": "New",
			"notes.panel.searchPlaceholder": "Search title, content or tags…",
			"notes.panel.empty": "No notes yet. Click “New” to capture commands, credentials or parameter values, or select any text to save it with one click.",
			"notes.panel.loading": "Loading…",
			"notes.panel.loadFailed": "Failed to load notes. Refresh and try again.",
			"notes.editor.titlePlaceholder": "Title (optional; defaults to the first line)",
			"notes.editor.contentPlaceholder": "Write down commands, credentials, parameter values or anything important…",
			"notes.editor.tagsPlaceholder": "Tags, comma separated (optional)",
			"notes.editor.save": "Save",
			"notes.editor.cancel": "Cancel",
			"notes.editor.saving": "Saving…",
			"notes.editor.mdMode": "Content display",
			"notes.editor.mdEdit": "Edit",
			"notes.editor.mdPreview": "Preview",
			"notes.editor.deleteConfirm": "Delete this note?",
			"notes.item.insert": "Insert",
			"notes.item.copy": "Copy",
			"notes.item.edit": "Edit",
			"notes.item.delete": "Delete",
			"notes.item.inserted": "Inserted into the input box — press Enter to send",
			"notes.item.noSession": "No session is open; copied to the clipboard instead",
			"notes.item.copied": "Copied to the clipboard",
			"notes.item.copyFailed": "Copy failed; select the text manually",
			"notes.item.saved": "Note saved",
			"notes.selection.save": "Save as note",
			"notes.selection.saved": "Saved as a note",
			"notes.source.selection": "Selection",
			"notes.source.composer": "From composer",
			"notes.source.manual": "Manual",
			"notes.scope.all": "All",
			"notes.scope.session": "This session",
			"notes.scope.global": "Global",
			"notes.scope.globalHint": "No session is open; showing global notes only",
			"notes.editor.globalOnly": "Save as global (visible in every session)",
			"notes.item.sessionTag": "session",
			"notes.item.globalTag": "global",
			"notes.settings.title": "Notes",
			"notes.settings.description": "Quick access, button size and the default scope for new notes.",
			"notes.settings.dockMode": "Quick access",
			"notes.settings.dockModeFloating": "Floating (draggable)",
			"notes.settings.dockModeFixed": "Pinned (top-right of the chat window)",
			"notes.settings.dockModeHint": "Floating: free drag on the right edge. Pinned: locked to the chat window’s top-right corner.",
			"notes.settings.buttonSize": "Floating button size",
			"notes.settings.buttonSizeSmall": "Small",
			"notes.settings.buttonSizeRegular": "Regular",
			"notes.settings.buttonSizeLarge": "Large",
			"notes.settings.defaultGlobal": "Default save as global",
			"notes.settings.defaultGlobalHint": "New notes default to global (visible in every session).",
			"notes.time.justNow": "just now",
			"notes.time.minutesAgo": "{n} min ago",
			"notes.time.hoursAgo": "{n} h ago",
			"notes.time.yesterday": "yesterday",
			"notes.time.daysAgo": "{n} d ago",
			"notes.confirm.ok": "OK",
			"notes.confirm.cancel": "Cancel"
		};
		/** Active dictionary, picked by the document language at call time. */
		function dictionary() {
			return (typeof document !== "undefined" ? document.documentElement.lang : "zh").toLowerCase().startsWith("en") ? en : zh;
		}
		/** Translate a key with optional `{name}` template params; a missing key degrades to the key itself. */
		function t(key, params) {
			let text = dictionary()[key] ?? key;
			if (params !== void 0) for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value));
			return text;
		}
		/** Relative time label for a timestamp. */
		function relativeTime(ts, tfn) {
			const diff = Date.now() - ts;
			if (diff < 6e4) return tfn("notes.time.justNow");
			const minutes = Math.floor(diff / 6e4);
			if (minutes < 60) return tfn("notes.time.minutesAgo", { n: minutes });
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return tfn("notes.time.hoursAgo", { n: hours });
			const days = Math.floor(hours / 24);
			if (days === 1) return tfn("notes.time.yesterday");
			return tfn("notes.time.daysAgo", { n: days });
		}
		//#endregion
		//#region node_modules/.pnpm/marked@16.3.0/node_modules/marked/lib/marked.esm.js
		/**
		* marked v16.3.0 - a markdown parser
		* Copyright (c) 2011-2025, Christopher Jeffrey. (MIT Licensed)
		* https://github.com/markedjs/marked
		*/
		/**
		* DO NOT EDIT THIS FILE
		* The code in this file is generated from files in ./src/
		*/
		function L() {
			return {
				async: !1,
				breaks: !1,
				extensions: null,
				gfm: !0,
				hooks: null,
				pedantic: !1,
				renderer: null,
				silent: !1,
				tokenizer: null,
				walkTokens: null
			};
		}
		var O = L();
		function G(l) {
			O = l;
		}
		var E = { exec: () => null };
		function h(l, e = "") {
			let t = typeof l == "string" ? l : l.source, n = {
				replace: (r, i) => {
					let s = typeof i == "string" ? i : i.source;
					return s = s.replace(m.caret, "$1"), t = t.replace(r, s), n;
				},
				getRegex: () => new RegExp(t, e)
			};
			return n;
		}
		var m = {
			codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
			outputLinkReplace: /\\([\[\]])/g,
			indentCodeCompensation: /^(\s+)(?:```)/,
			beginningSpace: /^\s+/,
			endingHash: /#$/,
			startingSpaceChar: /^ /,
			endingSpaceChar: / $/,
			nonSpaceChar: /[^ ]/,
			newLineCharGlobal: /\n/g,
			tabCharGlobal: /\t/g,
			multipleSpaceGlobal: /\s+/g,
			blankLine: /^[ \t]*$/,
			doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
			blockquoteStart: /^ {0,3}>/,
			blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
			blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
			listReplaceTabs: /^\t+/,
			listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
			listIsTask: /^\[[ xX]\] /,
			listReplaceTask: /^\[[ xX]\] +/,
			anyLine: /\n.*\n/,
			hrefBrackets: /^<(.*)>$/,
			tableDelimiter: /[:|]/,
			tableAlignChars: /^\||\| *$/g,
			tableRowBlankLine: /\n[ \t]*$/,
			tableAlignRight: /^ *-+: *$/,
			tableAlignCenter: /^ *:-+: *$/,
			tableAlignLeft: /^ *:-+ *$/,
			startATag: /^<a /i,
			endATag: /^<\/a>/i,
			startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
			endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
			startAngleBracket: /^</,
			endAngleBracket: />$/,
			pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
			unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
			escapeTest: /[&<>"']/,
			escapeReplace: /[&<>"']/g,
			escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
			escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
			unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,
			caret: /(^|[^\[])\^/g,
			percentDecode: /%25/g,
			findPipe: /\|/g,
			splitPipe: / \|/,
			slashPipe: /\\\|/g,
			carriageReturn: /\r\n|\r/g,
			spaceLine: /^ +$/gm,
			notSpaceStart: /^\S*/,
			endingNewline: /\n$/,
			listItemRegex: (l) => new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`),
			nextBulletRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
			hrRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
			fencesBeginRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}(?:\`\`\`|~~~)`),
			headingBeginRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}#`),
			htmlBeginRegex: (l) => new RegExp(`^ {0,${Math.min(3, l - 1)}}<(?:[a-z].*>|!--)`, "i")
		};
		var xe = /^(?:[ \t]*(?:\n|$))+/;
		var be = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
		var Re = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
		var C = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
		var Oe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
		var j = /(?:[*+-]|\d{1,9}[.)])/;
		var se = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
		var ie = h(se).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
		var Te = h(se).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
		var F = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
		var we = /^[^\n]+/;
		var Q = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
		var ye = h(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Q).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
		var Pe = h(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, j).getRegex();
		var v = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
		var U = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
		var Se = h("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", U).replace("tag", v).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
		var oe = h(F).replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
		var K = {
			blockquote: h(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", oe).getRegex(),
			code: be,
			def: ye,
			fences: Re,
			heading: Oe,
			hr: C,
			html: Se,
			lheading: ie,
			list: Pe,
			newline: xe,
			paragraph: oe,
			table: E,
			text: we
		};
		var re = h("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
		var _e = {
			...K,
			lheading: Te,
			table: re,
			paragraph: h(F).replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", re).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex()
		};
		var Le = {
			...K,
			html: h(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", U).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
			def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
			heading: /^(#{1,6})(.*)(?:\n+|$)/,
			fences: E,
			lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
			paragraph: h(F).replace("hr", C).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ie).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
		};
		var Me = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
		var ze = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
		var ae = /^( {2,}|\\)\n(?!\s*$)/;
		var Ae = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
		var D = /[\p{P}\p{S}]/u;
		var W = /[\s\p{P}\p{S}]/u;
		var le = /[^\s\p{P}\p{S}]/u;
		var Ee = h(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, W).getRegex();
		var ue = /(?!~)[\p{P}\p{S}]/u;
		var Ce = /(?!~)[\s\p{P}\p{S}]/u;
		var Ie = /(?:[^\s\p{P}\p{S}]|~)/u;
		var Be = /\[[^\[\]]*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)|`[^`]*?`|<(?! )[^<>]*?>/g;
		var pe = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
		var qe = h(pe, "u").replace(/punct/g, D).getRegex();
		var ve = h(pe, "u").replace(/punct/g, ue).getRegex();
		var ce = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
		var De = h(ce, "gu").replace(/notPunctSpace/g, le).replace(/punctSpace/g, W).replace(/punct/g, D).getRegex();
		var He = h(ce, "gu").replace(/notPunctSpace/g, Ie).replace(/punctSpace/g, Ce).replace(/punct/g, ue).getRegex();
		var Ze = h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, le).replace(/punctSpace/g, W).replace(/punct/g, D).getRegex();
		var Ge = h(/\\(punct)/, "gu").replace(/punct/g, D).getRegex();
		var Ne = h(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
		var je = h(U).replace("(?:-->|$)", "-->").getRegex();
		var Fe = h("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", je).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
		var q = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`[^`]*`|[^\[\]\\`])*?/;
		var Qe = h(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", q).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
		var he = h(/^!?\[(label)\]\[(ref)\]/).replace("label", q).replace("ref", Q).getRegex();
		var de = h(/^!?\[(ref)\](?:\[\])?/).replace("ref", Q).getRegex();
		var X = {
			_backpedal: E,
			anyPunctuation: Ge,
			autolink: Ne,
			blockSkip: Be,
			br: ae,
			code: ze,
			del: E,
			emStrongLDelim: qe,
			emStrongRDelimAst: De,
			emStrongRDelimUnd: Ze,
			escape: Me,
			link: Qe,
			nolink: de,
			punctuation: Ee,
			reflink: he,
			reflinkSearch: h("reflink|nolink(?!\\()", "g").replace("reflink", he).replace("nolink", de).getRegex(),
			tag: Fe,
			text: Ae,
			url: E
		};
		var Ke = {
			...X,
			link: h(/^!?\[(label)\]\((.*?)\)/).replace("label", q).getRegex(),
			reflink: h(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", q).getRegex()
		};
		var N = {
			...X,
			emStrongRDelimAst: He,
			emStrongLDelim: ve,
			url: h(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
			_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
			del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
			text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
		};
		var We = {
			...N,
			br: h(ae).replace("{2,}", "*").getRegex(),
			text: h(N.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
		};
		var I = {
			normal: K,
			gfm: _e,
			pedantic: Le
		};
		var M = {
			normal: X,
			gfm: N,
			breaks: We,
			pedantic: Ke
		};
		var Xe = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		};
		var ke = (l) => Xe[l];
		function w(l, e) {
			if (e) {
				if (m.escapeTest.test(l)) return l.replace(m.escapeReplace, ke);
			} else if (m.escapeTestNoEncode.test(l)) return l.replace(m.escapeReplaceNoEncode, ke);
			return l;
		}
		function J(l) {
			try {
				l = encodeURI(l).replace(m.percentDecode, "%");
			} catch {
				return null;
			}
			return l;
		}
		function V(l, e) {
			let n = l.replace(m.findPipe, (i, s, o) => {
				let a = !1, u = s;
				for (; --u >= 0 && o[u] === "\\";) a = !a;
				return a ? "|" : " |";
			}).split(m.splitPipe), r = 0;
			if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
			else for (; n.length < e;) n.push("");
			for (; r < n.length; r++) n[r] = n[r].trim().replace(m.slashPipe, "|");
			return n;
		}
		function z(l, e, t) {
			let n = l.length;
			if (n === 0) return "";
			let r = 0;
			for (; r < n;) {
				let i = l.charAt(n - r - 1);
				if (i === e && !t) r++;
				else if (i !== e && t) r++;
				else break;
			}
			return l.slice(0, n - r);
		}
		function ge(l, e) {
			if (l.indexOf(e[1]) === -1) return -1;
			let t = 0;
			for (let n = 0; n < l.length; n++) if (l[n] === "\\") n++;
			else if (l[n] === e[0]) t++;
			else if (l[n] === e[1] && (t--, t < 0)) return n;
			return t > 0 ? -2 : -1;
		}
		function fe(l, e, t, n, r) {
			let i = e.href, s = e.title || null, o = l[1].replace(r.other.outputLinkReplace, "$1");
			n.state.inLink = !0;
			let a = {
				type: l[0].charAt(0) === "!" ? "image" : "link",
				raw: t,
				href: i,
				title: s,
				text: o,
				tokens: n.inlineTokens(o)
			};
			return n.state.inLink = !1, a;
		}
		function Je(l, e, t) {
			let n = l.match(t.other.indentCodeCompensation);
			if (n === null) return e;
			let r = n[1];
			return e.split(`
`).map((i) => {
				let s = i.match(t.other.beginningSpace);
				if (s === null) return i;
				let [o] = s;
				return o.length >= r.length ? i.slice(r.length) : i;
			}).join(`
`);
		}
		var y = class {
			options;
			rules;
			lexer;
			constructor(e) {
				this.options = e || O;
			}
			space(e) {
				let t = this.rules.block.newline.exec(e);
				if (t && t[0].length > 0) return {
					type: "space",
					raw: t[0]
				};
			}
			code(e) {
				let t = this.rules.block.code.exec(e);
				if (t) {
					let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
					return {
						type: "code",
						raw: t[0],
						codeBlockStyle: "indented",
						text: this.options.pedantic ? n : z(n, `
`)
					};
				}
			}
			fences(e) {
				let t = this.rules.block.fences.exec(e);
				if (t) {
					let n = t[0], r = Je(n, t[3] || "", this.rules);
					return {
						type: "code",
						raw: n,
						lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
						text: r
					};
				}
			}
			heading(e) {
				let t = this.rules.block.heading.exec(e);
				if (t) {
					let n = t[2].trim();
					if (this.rules.other.endingHash.test(n)) {
						let r = z(n, "#");
						(this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
					}
					return {
						type: "heading",
						raw: t[0],
						depth: t[1].length,
						text: n,
						tokens: this.lexer.inline(n)
					};
				}
			}
			hr(e) {
				let t = this.rules.block.hr.exec(e);
				if (t) return {
					type: "hr",
					raw: z(t[0], `
`)
				};
			}
			blockquote(e) {
				let t = this.rules.block.blockquote.exec(e);
				if (t) {
					let n = z(t[0], `
`).split(`
`), r = "", i = "", s = [];
					for (; n.length > 0;) {
						let o = !1, a = [], u;
						for (u = 0; u < n.length; u++) if (this.rules.other.blockquoteStart.test(n[u])) a.push(n[u]), o = !0;
						else if (!o) a.push(n[u]);
						else break;
						n = n.slice(u);
						let p = a.join(`
`), c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
						r = r ? `${r}
${p}` : p, i = i ? `${i}
${c}` : c;
						let f = this.lexer.state.top;
						if (this.lexer.state.top = !0, this.lexer.blockTokens(c, s, !0), this.lexer.state.top = f, n.length === 0) break;
						let k = s.at(-1);
						if (k?.type === "code") break;
						if (k?.type === "blockquote") {
							let x = k, g = x.raw + `
` + n.join(`
`), T = this.blockquote(g);
							s[s.length - 1] = T, r = r.substring(0, r.length - x.raw.length) + T.raw, i = i.substring(0, i.length - x.text.length) + T.text;
							break;
						} else if (k?.type === "list") {
							let x = k, g = x.raw + `
` + n.join(`
`), T = this.list(g);
							s[s.length - 1] = T, r = r.substring(0, r.length - k.raw.length) + T.raw, i = i.substring(0, i.length - x.raw.length) + T.raw, n = g.substring(s.at(-1).raw.length).split(`
`);
							continue;
						}
					}
					return {
						type: "blockquote",
						raw: r,
						tokens: s,
						text: i
					};
				}
			}
			list(e) {
				let t = this.rules.block.list.exec(e);
				if (t) {
					let n = t[1].trim(), r = n.length > 1, i = {
						type: "list",
						raw: "",
						ordered: r,
						start: r ? +n.slice(0, -1) : "",
						loose: !1,
						items: []
					};
					n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
					let s = this.rules.other.listItemRegex(n), o = !1;
					for (; e;) {
						let u = !1, p = "", c = "";
						if (!(t = s.exec(e)) || this.rules.block.hr.test(e)) break;
						p = t[0], e = e.substring(p.length);
						let f = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (H) => " ".repeat(3 * H.length)), k = e.split(`
`, 1)[0], x = !f.trim(), g = 0;
						if (this.options.pedantic ? (g = 2, c = f.trimStart()) : x ? g = t[1].length + 1 : (g = t[2].search(this.rules.other.nonSpaceChar), g = g > 4 ? 1 : g, c = f.slice(g), g += t[1].length), x && this.rules.other.blankLine.test(k) && (p += k + `
`, e = e.substring(k.length + 1), u = !0), !u) {
							let H = this.rules.other.nextBulletRegex(g), ee = this.rules.other.hrRegex(g), te = this.rules.other.fencesBeginRegex(g), ne = this.rules.other.headingBeginRegex(g), me = this.rules.other.htmlBeginRegex(g);
							for (; e;) {
								let Z = e.split(`
`, 1)[0], A;
								if (k = Z, this.options.pedantic ? (k = k.replace(this.rules.other.listReplaceNesting, "  "), A = k) : A = k.replace(this.rules.other.tabCharGlobal, "    "), te.test(k) || ne.test(k) || me.test(k) || H.test(k) || ee.test(k)) break;
								if (A.search(this.rules.other.nonSpaceChar) >= g || !k.trim()) c += `
` + A.slice(g);
								else {
									if (x || f.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || te.test(f) || ne.test(f) || ee.test(f)) break;
									c += `
` + k;
								}
								!x && !k.trim() && (x = !0), p += Z + `
`, e = e.substring(Z.length + 1), f = A.slice(g);
							}
						}
						i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(p) && (o = !0));
						let T = null, Y;
						this.options.gfm && (T = this.rules.other.listIsTask.exec(c), T && (Y = T[0] !== "[ ] ", c = c.replace(this.rules.other.listReplaceTask, ""))), i.items.push({
							type: "list_item",
							raw: p,
							task: !!T,
							checked: Y,
							loose: !1,
							text: c,
							tokens: []
						}), i.raw += p;
					}
					let a = i.items.at(-1);
					if (a) a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
					else return;
					i.raw = i.raw.trimEnd();
					for (let u = 0; u < i.items.length; u++) if (this.lexer.state.top = !1, i.items[u].tokens = this.lexer.blockTokens(i.items[u].text, []), !i.loose) {
						let p = i.items[u].tokens.filter((f) => f.type === "space");
						i.loose = p.length > 0 && p.some((f) => this.rules.other.anyLine.test(f.raw));
					}
					if (i.loose) for (let u = 0; u < i.items.length; u++) i.items[u].loose = !0;
					return i;
				}
			}
			html(e) {
				let t = this.rules.block.html.exec(e);
				if (t) return {
					type: "html",
					block: !0,
					raw: t[0],
					pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
					text: t[0]
				};
			}
			def(e) {
				let t = this.rules.block.def.exec(e);
				if (t) {
					let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
					return {
						type: "def",
						tag: n,
						raw: t[0],
						href: r,
						title: i
					};
				}
			}
			table(e) {
				let t = this.rules.block.table.exec(e);
				if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
				let n = V(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s = {
					type: "table",
					raw: t[0],
					header: [],
					align: [],
					rows: []
				};
				if (n.length === r.length) {
					for (let o of r) this.rules.other.tableAlignRight.test(o) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? s.align.push("left") : s.align.push(null);
					for (let o = 0; o < n.length; o++) s.header.push({
						text: n[o],
						tokens: this.lexer.inline(n[o]),
						header: !0,
						align: s.align[o]
					});
					for (let o of i) s.rows.push(V(o, s.header.length).map((a, u) => ({
						text: a,
						tokens: this.lexer.inline(a),
						header: !1,
						align: s.align[u]
					})));
					return s;
				}
			}
			lheading(e) {
				let t = this.rules.block.lheading.exec(e);
				if (t) return {
					type: "heading",
					raw: t[0],
					depth: t[2].charAt(0) === "=" ? 1 : 2,
					text: t[1],
					tokens: this.lexer.inline(t[1])
				};
			}
			paragraph(e) {
				let t = this.rules.block.paragraph.exec(e);
				if (t) {
					let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
					return {
						type: "paragraph",
						raw: t[0],
						text: n,
						tokens: this.lexer.inline(n)
					};
				}
			}
			text(e) {
				let t = this.rules.block.text.exec(e);
				if (t) return {
					type: "text",
					raw: t[0],
					text: t[0],
					tokens: this.lexer.inline(t[0])
				};
			}
			escape(e) {
				let t = this.rules.inline.escape.exec(e);
				if (t) return {
					type: "escape",
					raw: t[0],
					text: t[1]
				};
			}
			tag(e) {
				let t = this.rules.inline.tag.exec(e);
				if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
					type: "html",
					raw: t[0],
					inLink: this.lexer.state.inLink,
					inRawBlock: this.lexer.state.inRawBlock,
					block: !1,
					text: t[0]
				};
			}
			link(e) {
				let t = this.rules.inline.link.exec(e);
				if (t) {
					let n = t[2].trim();
					if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
						if (!this.rules.other.endAngleBracket.test(n)) return;
						let s = z(n.slice(0, -1), "\\");
						if ((n.length - s.length) % 2 === 0) return;
					} else {
						let s = ge(t[2], "()");
						if (s === -2) return;
						if (s > -1) {
							let a = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s;
							t[2] = t[2].substring(0, s), t[0] = t[0].substring(0, a).trim(), t[3] = "";
						}
					}
					let r = t[2], i = "";
					if (this.options.pedantic) {
						let s = this.rules.other.pedanticHrefTitle.exec(r);
						s && (r = s[1], i = s[3]);
					} else i = t[3] ? t[3].slice(1, -1) : "";
					return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), fe(t, {
						href: r && r.replace(this.rules.inline.anyPunctuation, "$1"),
						title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
					}, t[0], this.lexer, this.rules);
				}
			}
			reflink(e, t) {
				let n;
				if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
					let i = t[(n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
					if (!i) {
						let s = n[0].charAt(0);
						return {
							type: "text",
							raw: s,
							text: s
						};
					}
					return fe(n, i, n[0], this.lexer, this.rules);
				}
			}
			emStrong(e, t, n = "") {
				let r = this.rules.inline.emStrongLDelim.exec(e);
				if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
				if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
					let s = [...r[0]].length - 1, o, a, u = s, p = 0, c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
					for (c.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = c.exec(t)) != null;) {
						if (o = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !o) continue;
						if (a = [...o].length, r[3] || r[4]) {
							u += a;
							continue;
						} else if ((r[5] || r[6]) && s % 3 && !((s + a) % 3)) {
							p += a;
							continue;
						}
						if (u -= a, u > 0) continue;
						a = Math.min(a, a + u + p);
						let f = [...r[0]][0].length, k = e.slice(0, s + r.index + f + a);
						if (Math.min(s, a) % 2) {
							let g = k.slice(1, -1);
							return {
								type: "em",
								raw: k,
								text: g,
								tokens: this.lexer.inlineTokens(g)
							};
						}
						let x = k.slice(2, -2);
						return {
							type: "strong",
							raw: k,
							text: x,
							tokens: this.lexer.inlineTokens(x)
						};
					}
				}
			}
			codespan(e) {
				let t = this.rules.inline.code.exec(e);
				if (t) {
					let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), r = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
					return r && i && (n = n.substring(1, n.length - 1)), {
						type: "codespan",
						raw: t[0],
						text: n
					};
				}
			}
			br(e) {
				let t = this.rules.inline.br.exec(e);
				if (t) return {
					type: "br",
					raw: t[0]
				};
			}
			del(e) {
				let t = this.rules.inline.del.exec(e);
				if (t) return {
					type: "del",
					raw: t[0],
					text: t[2],
					tokens: this.lexer.inlineTokens(t[2])
				};
			}
			autolink(e) {
				let t = this.rules.inline.autolink.exec(e);
				if (t) {
					let n, r;
					return t[2] === "@" ? (n = t[1], r = "mailto:" + n) : (n = t[1], r = n), {
						type: "link",
						raw: t[0],
						text: n,
						href: r,
						tokens: [{
							type: "text",
							raw: n,
							text: n
						}]
					};
				}
			}
			url(e) {
				let t;
				if (t = this.rules.inline.url.exec(e)) {
					let n, r;
					if (t[2] === "@") n = t[0], r = "mailto:" + n;
					else {
						let i;
						do
							i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
						while (i !== t[0]);
						n = t[0], t[1] === "www." ? r = "http://" + t[0] : r = t[0];
					}
					return {
						type: "link",
						raw: t[0],
						text: n,
						href: r,
						tokens: [{
							type: "text",
							raw: n,
							text: n
						}]
					};
				}
			}
			inlineText(e) {
				let t = this.rules.inline.text.exec(e);
				if (t) {
					let n = this.lexer.state.inRawBlock;
					return {
						type: "text",
						raw: t[0],
						text: t[0],
						escaped: n
					};
				}
			}
		};
		var b = class l {
			tokens;
			options;
			state;
			tokenizer;
			inlineQueue;
			constructor(e) {
				this.tokens = [], this.tokens.links = Object.create(null), this.options = e || O, this.options.tokenizer = this.options.tokenizer || new y(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
					inLink: !1,
					inRawBlock: !1,
					top: !0
				};
				let t = {
					other: m,
					block: I.normal,
					inline: M.normal
				};
				this.options.pedantic ? (t.block = I.pedantic, t.inline = M.pedantic) : this.options.gfm && (t.block = I.gfm, this.options.breaks ? t.inline = M.breaks : t.inline = M.gfm), this.tokenizer.rules = t;
			}
			static get rules() {
				return {
					block: I,
					inline: M
				};
			}
			static lex(e, t) {
				return new l(t).lex(e);
			}
			static lexInline(e, t) {
				return new l(t).inlineTokens(e);
			}
			lex(e) {
				e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
				for (let t = 0; t < this.inlineQueue.length; t++) {
					let n = this.inlineQueue[t];
					this.inlineTokens(n.src, n.tokens);
				}
				return this.inlineQueue = [], this.tokens;
			}
			blockTokens(e, t = [], n = !1) {
				for (this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, "")); e;) {
					let r;
					if (this.options.extensions?.block?.some((s) => (r = s.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
					if (r = this.tokenizer.space(e)) {
						e = e.substring(r.raw.length);
						let s = t.at(-1);
						r.raw.length === 1 && s !== void 0 ? s.raw += `
` : t.push(r);
						continue;
					}
					if (r = this.tokenizer.code(e)) {
						e = e.substring(r.raw.length);
						let s = t.at(-1);
						s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.at(-1).src = s.text) : t.push(r);
						continue;
					}
					if (r = this.tokenizer.fences(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					if (r = this.tokenizer.heading(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					if (r = this.tokenizer.hr(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					if (r = this.tokenizer.blockquote(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					if (r = this.tokenizer.list(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					if (r = this.tokenizer.html(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					if (r = this.tokenizer.def(e)) {
						e = e.substring(r.raw.length);
						let s = t.at(-1);
						s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.raw, this.inlineQueue.at(-1).src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
							href: r.href,
							title: r.title
						}, t.push(r));
						continue;
					}
					if (r = this.tokenizer.table(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					if (r = this.tokenizer.lheading(e)) {
						e = e.substring(r.raw.length), t.push(r);
						continue;
					}
					let i = e;
					if (this.options.extensions?.startBlock) {
						let s = 1 / 0, o = e.slice(1), a;
						this.options.extensions.startBlock.forEach((u) => {
							a = u.call({ lexer: this }, o), typeof a == "number" && a >= 0 && (s = Math.min(s, a));
						}), s < 1 / 0 && s >= 0 && (i = e.substring(0, s + 1));
					}
					if (this.state.top && (r = this.tokenizer.paragraph(i))) {
						let s = t.at(-1);
						n && s?.type === "paragraph" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
						continue;
					}
					if (r = this.tokenizer.text(e)) {
						e = e.substring(r.raw.length);
						let s = t.at(-1);
						s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r);
						continue;
					}
					if (e) {
						let s = "Infinite loop on byte: " + e.charCodeAt(0);
						if (this.options.silent) {
							console.error(s);
							break;
						} else throw new Error(s);
					}
				}
				return this.state.top = !0, t;
			}
			inline(e, t = []) {
				return this.inlineQueue.push({
					src: e,
					tokens: t
				}), t;
			}
			inlineTokens(e, t = []) {
				let n = e, r = null;
				if (this.tokens.links) {
					let o = Object.keys(this.tokens.links);
					if (o.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null;) o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
				}
				for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null;) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
				for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null;) n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
				n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
				let i = !1, s = "";
				for (; e;) {
					i || (s = ""), i = !1;
					let o;
					if (this.options.extensions?.inline?.some((u) => (o = u.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1)) continue;
					if (o = this.tokenizer.escape(e)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (o = this.tokenizer.tag(e)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (o = this.tokenizer.link(e)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (o = this.tokenizer.reflink(e, this.tokens.links)) {
						e = e.substring(o.raw.length);
						let u = t.at(-1);
						o.type === "text" && u?.type === "text" ? (u.raw += o.raw, u.text += o.text) : t.push(o);
						continue;
					}
					if (o = this.tokenizer.emStrong(e, n, s)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (o = this.tokenizer.codespan(e)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (o = this.tokenizer.br(e)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (o = this.tokenizer.del(e)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (o = this.tokenizer.autolink(e)) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					if (!this.state.inLink && (o = this.tokenizer.url(e))) {
						e = e.substring(o.raw.length), t.push(o);
						continue;
					}
					let a = e;
					if (this.options.extensions?.startInline) {
						let u = 1 / 0, p = e.slice(1), c;
						this.options.extensions.startInline.forEach((f) => {
							c = f.call({ lexer: this }, p), typeof c == "number" && c >= 0 && (u = Math.min(u, c));
						}), u < 1 / 0 && u >= 0 && (a = e.substring(0, u + 1));
					}
					if (o = this.tokenizer.inlineText(a)) {
						e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (s = o.raw.slice(-1)), i = !0;
						let u = t.at(-1);
						u?.type === "text" ? (u.raw += o.raw, u.text += o.text) : t.push(o);
						continue;
					}
					if (e) {
						let u = "Infinite loop on byte: " + e.charCodeAt(0);
						if (this.options.silent) {
							console.error(u);
							break;
						} else throw new Error(u);
					}
				}
				return t;
			}
		};
		var P = class {
			options;
			parser;
			constructor(e) {
				this.options = e || O;
			}
			space(e) {
				return "";
			}
			code({ text: e, lang: t, escaped: n }) {
				let r = (t || "").match(m.notSpaceStart)?.[0], i = e.replace(m.endingNewline, "") + `
`;
				return r ? "<pre><code class=\"language-" + w(r) + "\">" + (n ? i : w(i, !0)) + `</code></pre>
` : "<pre><code>" + (n ? i : w(i, !0)) + `</code></pre>
`;
			}
			blockquote({ tokens: e }) {
				return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
			}
			html({ text: e }) {
				return e;
			}
			def(e) {
				return "";
			}
			heading({ tokens: e, depth: t }) {
				return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
			}
			hr(e) {
				return `<hr>
`;
			}
			list(e) {
				let t = e.ordered, n = e.start, r = "";
				for (let o = 0; o < e.items.length; o++) {
					let a = e.items[o];
					r += this.listitem(a);
				}
				let i = t ? "ol" : "ul", s = t && n !== 1 ? " start=\"" + n + "\"" : "";
				return "<" + i + s + `>
` + r + "</" + i + `>
`;
			}
			listitem(e) {
				let t = "";
				if (e.task) {
					let n = this.checkbox({ checked: !!e.checked });
					e.loose ? e.tokens[0]?.type === "paragraph" ? (e.tokens[0].text = n + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && e.tokens[0].tokens[0].type === "text" && (e.tokens[0].tokens[0].text = n + " " + w(e.tokens[0].tokens[0].text), e.tokens[0].tokens[0].escaped = !0)) : e.tokens.unshift({
						type: "text",
						raw: n + " ",
						text: n + " ",
						escaped: !0
					}) : t += n + " ";
				}
				return t += this.parser.parse(e.tokens, !!e.loose), `<li>${t}</li>
`;
			}
			checkbox({ checked: e }) {
				return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\">";
			}
			paragraph({ tokens: e }) {
				return `<p>${this.parser.parseInline(e)}</p>
`;
			}
			table(e) {
				let t = "", n = "";
				for (let i = 0; i < e.header.length; i++) n += this.tablecell(e.header[i]);
				t += this.tablerow({ text: n });
				let r = "";
				for (let i = 0; i < e.rows.length; i++) {
					let s = e.rows[i];
					n = "";
					for (let o = 0; o < s.length; o++) n += this.tablecell(s[o]);
					r += this.tablerow({ text: n });
				}
				return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + r + `</table>
`;
			}
			tablerow({ text: e }) {
				return `<tr>
${e}</tr>
`;
			}
			tablecell(e) {
				let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
				return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
			}
			strong({ tokens: e }) {
				return `<strong>${this.parser.parseInline(e)}</strong>`;
			}
			em({ tokens: e }) {
				return `<em>${this.parser.parseInline(e)}</em>`;
			}
			codespan({ text: e }) {
				return `<code>${w(e, !0)}</code>`;
			}
			br(e) {
				return "<br>";
			}
			del({ tokens: e }) {
				return `<del>${this.parser.parseInline(e)}</del>`;
			}
			link({ href: e, title: t, tokens: n }) {
				let r = this.parser.parseInline(n), i = J(e);
				if (i === null) return r;
				e = i;
				let s = "<a href=\"" + e + "\"";
				return t && (s += " title=\"" + w(t) + "\""), s += ">" + r + "</a>", s;
			}
			image({ href: e, title: t, text: n, tokens: r }) {
				r && (n = this.parser.parseInline(r, this.parser.textRenderer));
				let i = J(e);
				if (i === null) return w(n);
				e = i;
				let s = `<img src="${e}" alt="${n}"`;
				return t && (s += ` title="${w(t)}"`), s += ">", s;
			}
			text(e) {
				return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : w(e.text);
			}
		};
		var $ = class {
			strong({ text: e }) {
				return e;
			}
			em({ text: e }) {
				return e;
			}
			codespan({ text: e }) {
				return e;
			}
			del({ text: e }) {
				return e;
			}
			html({ text: e }) {
				return e;
			}
			text({ text: e }) {
				return e;
			}
			link({ text: e }) {
				return "" + e;
			}
			image({ text: e }) {
				return "" + e;
			}
			br() {
				return "";
			}
		};
		var R = class l {
			options;
			renderer;
			textRenderer;
			constructor(e) {
				this.options = e || O, this.options.renderer = this.options.renderer || new P(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $();
			}
			static parse(e, t) {
				return new l(t).parse(e);
			}
			static parseInline(e, t) {
				return new l(t).parseInline(e);
			}
			parse(e, t = !0) {
				let n = "";
				for (let r = 0; r < e.length; r++) {
					let i = e[r];
					if (this.options.extensions?.renderers?.[i.type]) {
						let o = i, a = this.options.extensions.renderers[o.type].call({ parser: this }, o);
						if (a !== !1 || ![
							"space",
							"hr",
							"heading",
							"code",
							"table",
							"blockquote",
							"list",
							"html",
							"def",
							"paragraph",
							"text"
						].includes(o.type)) {
							n += a || "";
							continue;
						}
					}
					let s = i;
					switch (s.type) {
						case "space":
							n += this.renderer.space(s);
							continue;
						case "hr":
							n += this.renderer.hr(s);
							continue;
						case "heading":
							n += this.renderer.heading(s);
							continue;
						case "code":
							n += this.renderer.code(s);
							continue;
						case "table":
							n += this.renderer.table(s);
							continue;
						case "blockquote":
							n += this.renderer.blockquote(s);
							continue;
						case "list":
							n += this.renderer.list(s);
							continue;
						case "html":
							n += this.renderer.html(s);
							continue;
						case "def":
							n += this.renderer.def(s);
							continue;
						case "paragraph":
							n += this.renderer.paragraph(s);
							continue;
						case "text": {
							let o = s, a = this.renderer.text(o);
							for (; r + 1 < e.length && e[r + 1].type === "text";) o = e[++r], a += `
` + this.renderer.text(o);
							t ? n += this.renderer.paragraph({
								type: "paragraph",
								raw: a,
								text: a,
								tokens: [{
									type: "text",
									raw: a,
									text: a,
									escaped: !0
								}]
							}) : n += a;
							continue;
						}
						default: {
							let o = "Token with \"" + s.type + "\" type was not found.";
							if (this.options.silent) return console.error(o), "";
							throw new Error(o);
						}
					}
				}
				return n;
			}
			parseInline(e, t = this.renderer) {
				let n = "";
				for (let r = 0; r < e.length; r++) {
					let i = e[r];
					if (this.options.extensions?.renderers?.[i.type]) {
						let o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
						if (o !== !1 || ![
							"escape",
							"html",
							"link",
							"image",
							"strong",
							"em",
							"codespan",
							"br",
							"del",
							"text"
						].includes(i.type)) {
							n += o || "";
							continue;
						}
					}
					let s = i;
					switch (s.type) {
						case "escape":
							n += t.text(s);
							break;
						case "html":
							n += t.html(s);
							break;
						case "link":
							n += t.link(s);
							break;
						case "image":
							n += t.image(s);
							break;
						case "strong":
							n += t.strong(s);
							break;
						case "em":
							n += t.em(s);
							break;
						case "codespan":
							n += t.codespan(s);
							break;
						case "br":
							n += t.br(s);
							break;
						case "del":
							n += t.del(s);
							break;
						case "text":
							n += t.text(s);
							break;
						default: {
							let o = "Token with \"" + s.type + "\" type was not found.";
							if (this.options.silent) return console.error(o), "";
							throw new Error(o);
						}
					}
				}
				return n;
			}
		};
		var S = class {
			options;
			block;
			constructor(e) {
				this.options = e || O;
			}
			static passThroughHooks = /* @__PURE__ */ new Set([
				"preprocess",
				"postprocess",
				"processAllTokens",
				"emStrongMask"
			]);
			static passThroughHooksRespectAsync = /* @__PURE__ */ new Set([
				"preprocess",
				"postprocess",
				"processAllTokens"
			]);
			preprocess(e) {
				return e;
			}
			postprocess(e) {
				return e;
			}
			processAllTokens(e) {
				return e;
			}
			emStrongMask(e) {
				return e;
			}
			provideLexer() {
				return this.block ? b.lex : b.lexInline;
			}
			provideParser() {
				return this.block ? R.parse : R.parseInline;
			}
		};
		var B = class {
			defaults = L();
			options = this.setOptions;
			parse = this.parseMarkdown(!0);
			parseInline = this.parseMarkdown(!1);
			Parser = R;
			Renderer = P;
			TextRenderer = $;
			Lexer = b;
			Tokenizer = y;
			Hooks = S;
			constructor(...e) {
				this.use(...e);
			}
			walkTokens(e, t) {
				let n = [];
				for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
					case "table": {
						let i = r;
						for (let s of i.header) n = n.concat(this.walkTokens(s.tokens, t));
						for (let s of i.rows) for (let o of s) n = n.concat(this.walkTokens(o.tokens, t));
						break;
					}
					case "list": {
						let i = r;
						n = n.concat(this.walkTokens(i.items, t));
						break;
					}
					default: {
						let i = r;
						this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((s) => {
							let o = i[s].flat(1 / 0);
							n = n.concat(this.walkTokens(o, t));
						}) : i.tokens && (n = n.concat(this.walkTokens(i.tokens, t)));
					}
				}
				return n;
			}
			use(...e) {
				let t = this.defaults.extensions || {
					renderers: {},
					childTokens: {}
				};
				return e.forEach((n) => {
					let r = { ...n };
					if (r.async = this.defaults.async || r.async || !1, n.extensions && (n.extensions.forEach((i) => {
						if (!i.name) throw new Error("extension name required");
						if ("renderer" in i) {
							let s = t.renderers[i.name];
							s ? t.renderers[i.name] = function(...o) {
								let a = i.renderer.apply(this, o);
								return a === !1 && (a = s.apply(this, o)), a;
							} : t.renderers[i.name] = i.renderer;
						}
						if ("tokenizer" in i) {
							if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
							let s = t[i.level];
							s ? s.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
						}
						"childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
					}), r.extensions = t), n.renderer) {
						let i = this.defaults.renderer || new P(this.defaults);
						for (let s in n.renderer) {
							if (!(s in i)) throw new Error(`renderer '${s}' does not exist`);
							if (["options", "parser"].includes(s)) continue;
							let o = s, a = n.renderer[o], u = i[o];
							i[o] = (...p) => {
								let c = a.apply(i, p);
								return c === !1 && (c = u.apply(i, p)), c || "";
							};
						}
						r.renderer = i;
					}
					if (n.tokenizer) {
						let i = this.defaults.tokenizer || new y(this.defaults);
						for (let s in n.tokenizer) {
							if (!(s in i)) throw new Error(`tokenizer '${s}' does not exist`);
							if ([
								"options",
								"rules",
								"lexer"
							].includes(s)) continue;
							let o = s, a = n.tokenizer[o], u = i[o];
							i[o] = (...p) => {
								let c = a.apply(i, p);
								return c === !1 && (c = u.apply(i, p)), c;
							};
						}
						r.tokenizer = i;
					}
					if (n.hooks) {
						let i = this.defaults.hooks || new S();
						for (let s in n.hooks) {
							if (!(s in i)) throw new Error(`hook '${s}' does not exist`);
							if (["options", "block"].includes(s)) continue;
							let o = s, a = n.hooks[o], u = i[o];
							S.passThroughHooks.has(s) ? i[o] = (p) => {
								if (this.defaults.async && S.passThroughHooksRespectAsync.has(s)) return Promise.resolve(a.call(i, p)).then((f) => u.call(i, f));
								let c = a.call(i, p);
								return u.call(i, c);
							} : i[o] = (...p) => {
								let c = a.apply(i, p);
								return c === !1 && (c = u.apply(i, p)), c;
							};
						}
						r.hooks = i;
					}
					if (n.walkTokens) {
						let i = this.defaults.walkTokens, s = n.walkTokens;
						r.walkTokens = function(o) {
							let a = [];
							return a.push(s.call(this, o)), i && (a = a.concat(i.call(this, o))), a;
						};
					}
					this.defaults = {
						...this.defaults,
						...r
					};
				}), this;
			}
			setOptions(e) {
				return this.defaults = {
					...this.defaults,
					...e
				}, this;
			}
			lexer(e, t) {
				return b.lex(e, t ?? this.defaults);
			}
			parser(e, t) {
				return R.parse(e, t ?? this.defaults);
			}
			parseMarkdown(e) {
				return (n, r) => {
					let i = { ...r }, s = {
						...this.defaults,
						...i
					}, o = this.onError(!!s.silent, !!s.async);
					if (this.defaults.async === !0 && i.async === !1) return o(/* @__PURE__ */ new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
					if (typeof n > "u" || n === null) return o(/* @__PURE__ */ new Error("marked(): input parameter is undefined or null"));
					if (typeof n != "string") return o(/* @__PURE__ */ new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
					s.hooks && (s.hooks.options = s, s.hooks.block = e);
					let a = s.hooks ? s.hooks.provideLexer() : e ? b.lex : b.lexInline, u = s.hooks ? s.hooks.provideParser() : e ? R.parse : R.parseInline;
					if (s.async) return Promise.resolve(s.hooks ? s.hooks.preprocess(n) : n).then((p) => a(p, s)).then((p) => s.hooks ? s.hooks.processAllTokens(p) : p).then((p) => s.walkTokens ? Promise.all(this.walkTokens(p, s.walkTokens)).then(() => p) : p).then((p) => u(p, s)).then((p) => s.hooks ? s.hooks.postprocess(p) : p).catch(o);
					try {
						s.hooks && (n = s.hooks.preprocess(n));
						let p = a(n, s);
						s.hooks && (p = s.hooks.processAllTokens(p)), s.walkTokens && this.walkTokens(p, s.walkTokens);
						let c = u(p, s);
						return s.hooks && (c = s.hooks.postprocess(c)), c;
					} catch (p) {
						return o(p);
					}
				};
			}
			onError(e, t) {
				return (n) => {
					if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
						let r = "<p>An error occurred:</p><pre>" + w(n.message + "", !0) + "</pre>";
						return t ? Promise.resolve(r) : r;
					}
					if (t) return Promise.reject(n);
					throw n;
				};
			}
		};
		var _ = new B();
		function d(l, e) {
			return _.parse(l, e);
		}
		d.options = d.setOptions = function(l) {
			return _.setOptions(l), d.defaults = _.defaults, G(d.defaults), d;
		};
		d.getDefaults = L;
		d.defaults = O;
		d.use = function(...l) {
			return _.use(...l), d.defaults = _.defaults, G(d.defaults), d;
		};
		d.walkTokens = function(l, e) {
			return _.walkTokens(l, e);
		};
		d.parseInline = _.parseInline;
		d.Parser = R;
		d.parser = R.parse;
		d.Renderer = P;
		d.TextRenderer = $;
		d.Lexer = b;
		d.lexer = b.lex;
		d.Tokenizer = y;
		d.Hooks = S;
		d.parse = d;
		d.options;
		d.setOptions;
		d.use;
		d.walkTokens;
		d.parseInline;
		R.parse;
		b.lex;
		//#endregion
		//#region node_modules/.pnpm/dompurify@3.4.14/node_modules/dompurify/dist/purify.es.mjs
		/*! @license DOMPurify 3.4.14 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.14/LICENSE */
		function _arrayLikeToArray(r, a) {
			(null == a || a > r.length) && (a = r.length);
			for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
			return n;
		}
		function _arrayWithHoles(r) {
			if (Array.isArray(r)) return r;
		}
		function _iterableToArrayLimit(r, l) {
			var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
			if (null != t) {
				var e, n, i, u, a = [], f = true, o = false;
				try {
					if (i = (t = t.call(r)).next, 0 === l);
					else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
				} catch (r) {
					o = true, n = r;
				} finally {
					try {
						if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
					} finally {
						if (o) throw n;
					}
				}
				return a;
			}
		}
		function _nonIterableRest() {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		function _slicedToArray(r, e) {
			return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
		}
		function _unsupportedIterableToArray(r, a) {
			if (r) {
				if ("string" == typeof r) return _arrayLikeToArray(r, a);
				var t = {}.toString.call(r).slice(8, -1);
				return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
			}
		}
		const entries = Object.entries;
		const setPrototypeOf = Object.setPrototypeOf;
		const isFrozen = Object.isFrozen;
		const getPrototypeOf = Object.getPrototypeOf;
		const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
		let freeze = Object.freeze;
		let seal = Object.seal;
		let create = Object.create;
		let _ref = typeof Reflect !== "undefined" && Reflect;
		let apply$1 = _ref.apply;
		let construct = _ref.construct;
		if (!freeze) freeze = function freeze(x) {
			return x;
		};
		if (!seal) seal = function seal(x) {
			return x;
		};
		if (!apply$1) apply$1 = function apply(func, thisArg) {
			for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
			return func.apply(thisArg, args);
		};
		if (!construct) construct = function construct(Func) {
			for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
			return new Func(...args);
		};
		const arrayForEach = unapply(Array.prototype.forEach);
		const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
		const arrayPop = unapply(Array.prototype.pop);
		const arrayPush = unapply(Array.prototype.push);
		const arraySplice = unapply(Array.prototype.splice);
		const arrayIsArray = Array.isArray;
		const stringToLowerCase = unapply(String.prototype.toLowerCase);
		const stringToString = unapply(String.prototype.toString);
		const stringMatch = unapply(String.prototype.match);
		const stringReplace = unapply(String.prototype.replace);
		const stringIndexOf = unapply(String.prototype.indexOf);
		const stringTrim = unapply(String.prototype.trim);
		const numberToString = unapply(Number.prototype.toString);
		const booleanToString = unapply(Boolean.prototype.toString);
		const bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
		const symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
		const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
		const objectToString = unapply(Object.prototype.toString);
		const regExpTest = unapply(RegExp.prototype.test);
		const typeErrorCreate = unconstruct(TypeError);
		/**
		* Creates a new function that calls the given function with a specified thisArg and arguments.
		*
		* @param func - The function to be wrapped and called.
		* @returns A new function that calls the given function with a specified thisArg and arguments.
		*/
		function unapply(func) {
			return function(thisArg) {
				if (thisArg instanceof RegExp) thisArg.lastIndex = 0;
				for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
				return apply$1(func, thisArg, args);
			};
		}
		/**
		* Creates a new function that constructs an instance of the given constructor function with the provided arguments.
		*
		* @param func - The constructor function to be wrapped and called.
		* @returns A new function that constructs an instance of the given constructor function with the provided arguments.
		*/
		function unconstruct(Func) {
			return function() {
				for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
				return construct(Func, args);
			};
		}
		/**
		* Add properties to a lookup table
		*
		* @param set - The set to which elements will be added.
		* @param array - The array containing elements to be added to the set.
		* @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
		* @returns The modified set with added elements.
		*/
		function addToSet(set, array) {
			let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
			if (setPrototypeOf) setPrototypeOf(set, null);
			if (!arrayIsArray(array)) return set;
			let l = array.length;
			while (l--) {
				let element = array[l];
				if (typeof element === "string") {
					const lcElement = transformCaseFunc(element);
					if (lcElement !== element) {
						if (!isFrozen(array)) array[l] = lcElement;
						element = lcElement;
					}
				}
				set[element] = true;
			}
			return set;
		}
		/**
		* Clean up an array to harden against CSPP
		*
		* @param array - The array to be cleaned.
		* @returns The cleaned version of the array
		*/
		function cleanArray(array) {
			for (let index = 0; index < array.length; index++) if (!objectHasOwnProperty(array, index)) array[index] = null;
			return array;
		}
		/**
		* Shallow clone an object
		*
		* @param object - The object to be cloned.
		* @returns A new object that copies the original.
		*/
		function clone(object) {
			const newObject = create(null);
			for (const _ref2 of entries(object)) {
				var _ref3 = _slicedToArray(_ref2, 2);
				const property = _ref3[0];
				const value = _ref3[1];
				if (objectHasOwnProperty(object, property)) {
					if (arrayIsArray(value)) newObject[property] = cleanArray(value);
					else if (value && typeof value === "object" && value.constructor === Object) newObject[property] = clone(value);
					else newObject[property] = value;
				}
			}
			return newObject;
		}
		/**
		* Convert non-node values into strings without depending on direct property access.
		*
		* @param value - The value to stringify.
		* @returns A string representation of the provided value.
		*/
		function stringifyValue(value) {
			switch (typeof value) {
				case "string": return value;
				case "number": return numberToString(value);
				case "boolean": return booleanToString(value);
				case "bigint": return bigintToString ? bigintToString(value) : "0";
				case "symbol": return symbolToString ? symbolToString(value) : "Symbol()";
				case "undefined": return objectToString(value);
				case "function":
				case "object": {
					if (value === null) return objectToString(value);
					const valueAsRecord = value;
					const valueToString = lookupGetter(valueAsRecord, "toString");
					if (typeof valueToString === "function") {
						const stringified = valueToString(valueAsRecord);
						return typeof stringified === "string" ? stringified : objectToString(stringified);
					}
					return objectToString(value);
				}
				default: return objectToString(value);
			}
		}
		/**
		* This method automatically checks if the prop is function or getter and behaves accordingly.
		*
		* @param object - The object to look up the getter function in its prototype chain.
		* @param prop - The property name for which to find the getter function.
		* @returns The getter function found in the prototype chain or a fallback function.
		*/
		function lookupGetter(object, prop) {
			while (object !== null) {
				const desc = getOwnPropertyDescriptor(object, prop);
				if (desc) {
					if (desc.get) return unapply(desc.get);
					if (typeof desc.value === "function") return unapply(desc.value);
				}
				object = getPrototypeOf(object);
			}
			function fallbackValue() {
				return null;
			}
			return fallbackValue;
		}
		function isRegex(value) {
			try {
				regExpTest(value, "");
				return true;
			} catch (_unused) {
				return false;
			}
		}
		const html$1 = freeze([
			"a",
			"abbr",
			"acronym",
			"address",
			"area",
			"article",
			"aside",
			"audio",
			"b",
			"bdi",
			"bdo",
			"big",
			"blink",
			"blockquote",
			"body",
			"br",
			"button",
			"canvas",
			"caption",
			"center",
			"cite",
			"code",
			"col",
			"colgroup",
			"content",
			"data",
			"datalist",
			"dd",
			"decorator",
			"del",
			"details",
			"dfn",
			"dialog",
			"dir",
			"div",
			"dl",
			"dt",
			"element",
			"em",
			"fieldset",
			"figcaption",
			"figure",
			"font",
			"footer",
			"form",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"head",
			"header",
			"hgroup",
			"hr",
			"html",
			"i",
			"img",
			"input",
			"ins",
			"kbd",
			"label",
			"legend",
			"li",
			"main",
			"map",
			"mark",
			"marquee",
			"menu",
			"menuitem",
			"meter",
			"nav",
			"nobr",
			"ol",
			"optgroup",
			"option",
			"output",
			"p",
			"picture",
			"pre",
			"progress",
			"q",
			"rp",
			"rt",
			"ruby",
			"s",
			"samp",
			"search",
			"section",
			"select",
			"shadow",
			"slot",
			"small",
			"source",
			"spacer",
			"span",
			"strike",
			"strong",
			"style",
			"sub",
			"summary",
			"sup",
			"table",
			"tbody",
			"td",
			"template",
			"textarea",
			"tfoot",
			"th",
			"thead",
			"time",
			"tr",
			"track",
			"tt",
			"u",
			"ul",
			"var",
			"video",
			"wbr"
		]);
		const svg$1 = freeze([
			"svg",
			"a",
			"altglyph",
			"altglyphdef",
			"altglyphitem",
			"animatecolor",
			"animatemotion",
			"animatetransform",
			"circle",
			"clippath",
			"defs",
			"desc",
			"ellipse",
			"enterkeyhint",
			"exportparts",
			"filter",
			"font",
			"g",
			"glyph",
			"glyphref",
			"hkern",
			"image",
			"inputmode",
			"line",
			"lineargradient",
			"marker",
			"mask",
			"metadata",
			"mpath",
			"part",
			"path",
			"pattern",
			"polygon",
			"polyline",
			"radialgradient",
			"rect",
			"stop",
			"style",
			"switch",
			"symbol",
			"text",
			"textpath",
			"title",
			"tref",
			"tspan",
			"view",
			"vkern"
		]);
		const svgFilters = freeze([
			"feBlend",
			"feColorMatrix",
			"feComponentTransfer",
			"feComposite",
			"feConvolveMatrix",
			"feDiffuseLighting",
			"feDisplacementMap",
			"feDistantLight",
			"feDropShadow",
			"feFlood",
			"feFuncA",
			"feFuncB",
			"feFuncG",
			"feFuncR",
			"feGaussianBlur",
			"feImage",
			"feMerge",
			"feMergeNode",
			"feMorphology",
			"feOffset",
			"fePointLight",
			"feSpecularLighting",
			"feSpotLight",
			"feTile",
			"feTurbulence"
		]);
		const svgDisallowed = freeze([
			"animate",
			"color-profile",
			"cursor",
			"discard",
			"font-face",
			"font-face-format",
			"font-face-name",
			"font-face-src",
			"font-face-uri",
			"foreignobject",
			"hatch",
			"hatchpath",
			"mesh",
			"meshgradient",
			"meshpatch",
			"meshrow",
			"missing-glyph",
			"script",
			"set",
			"solidcolor",
			"unknown",
			"use"
		]);
		const mathMl$1 = freeze([
			"math",
			"menclose",
			"merror",
			"mfenced",
			"mfrac",
			"mglyph",
			"mi",
			"mlabeledtr",
			"mmultiscripts",
			"mn",
			"mo",
			"mover",
			"mpadded",
			"mphantom",
			"mroot",
			"mrow",
			"ms",
			"mspace",
			"msqrt",
			"mstyle",
			"msub",
			"msup",
			"msubsup",
			"mtable",
			"mtd",
			"mtext",
			"mtr",
			"munder",
			"munderover",
			"mprescripts"
		]);
		const mathMlDisallowed = freeze([
			"maction",
			"maligngroup",
			"malignmark",
			"mlongdiv",
			"mscarries",
			"mscarry",
			"msgroup",
			"mstack",
			"msline",
			"msrow",
			"semantics",
			"annotation",
			"annotation-xml",
			"mprescripts",
			"none"
		]);
		const text = freeze(["#text"]);
		const html = freeze([
			"accept",
			"action",
			"align",
			"alt",
			"autocapitalize",
			"autocomplete",
			"autopictureinpicture",
			"autoplay",
			"background",
			"bgcolor",
			"border",
			"capture",
			"cellpadding",
			"cellspacing",
			"checked",
			"cite",
			"class",
			"clear",
			"color",
			"cols",
			"colspan",
			"command",
			"commandfor",
			"controls",
			"controlslist",
			"coords",
			"crossorigin",
			"datetime",
			"decoding",
			"default",
			"dir",
			"disabled",
			"disablepictureinpicture",
			"disableremoteplayback",
			"download",
			"draggable",
			"enctype",
			"enterkeyhint",
			"exportparts",
			"face",
			"for",
			"headers",
			"height",
			"hidden",
			"high",
			"href",
			"hreflang",
			"id",
			"inert",
			"inputmode",
			"integrity",
			"ismap",
			"kind",
			"label",
			"lang",
			"list",
			"loading",
			"loop",
			"low",
			"max",
			"maxlength",
			"media",
			"method",
			"min",
			"minlength",
			"multiple",
			"muted",
			"name",
			"nonce",
			"noshade",
			"novalidate",
			"nowrap",
			"open",
			"optimum",
			"part",
			"pattern",
			"placeholder",
			"playsinline",
			"popover",
			"popovertarget",
			"popovertargetaction",
			"poster",
			"preload",
			"pubdate",
			"radiogroup",
			"readonly",
			"rel",
			"required",
			"rev",
			"reversed",
			"role",
			"rows",
			"rowspan",
			"spellcheck",
			"scope",
			"selected",
			"shape",
			"size",
			"sizes",
			"slot",
			"span",
			"srclang",
			"start",
			"src",
			"srcset",
			"step",
			"style",
			"summary",
			"tabindex",
			"title",
			"translate",
			"type",
			"usemap",
			"valign",
			"value",
			"width",
			"wrap",
			"xmlns"
		]);
		const svg = freeze([
			"accent-height",
			"accumulate",
			"additive",
			"alignment-baseline",
			"amplitude",
			"ascent",
			"attributename",
			"attributetype",
			"azimuth",
			"basefrequency",
			"baseline-shift",
			"begin",
			"bias",
			"by",
			"class",
			"clip",
			"clippathunits",
			"clip-path",
			"clip-rule",
			"color",
			"color-interpolation",
			"color-interpolation-filters",
			"color-profile",
			"color-rendering",
			"cx",
			"cy",
			"d",
			"dx",
			"dy",
			"diffuseconstant",
			"direction",
			"display",
			"divisor",
			"dominant-baseline",
			"dur",
			"edgemode",
			"elevation",
			"end",
			"exponent",
			"fill",
			"fill-opacity",
			"fill-rule",
			"filter",
			"filterunits",
			"flood-color",
			"flood-opacity",
			"font-family",
			"font-size",
			"font-size-adjust",
			"font-stretch",
			"font-style",
			"font-variant",
			"font-weight",
			"fx",
			"fy",
			"g1",
			"g2",
			"glyph-name",
			"glyphref",
			"gradientunits",
			"gradienttransform",
			"height",
			"href",
			"id",
			"image-rendering",
			"in",
			"in2",
			"intercept",
			"k",
			"k1",
			"k2",
			"k3",
			"k4",
			"kerning",
			"keypoints",
			"keysplines",
			"keytimes",
			"lang",
			"lengthadjust",
			"letter-spacing",
			"kernelmatrix",
			"kernelunitlength",
			"lighting-color",
			"local",
			"marker-end",
			"marker-mid",
			"marker-start",
			"markerheight",
			"markerunits",
			"markerwidth",
			"maskcontentunits",
			"maskunits",
			"max",
			"mask",
			"mask-type",
			"media",
			"method",
			"mode",
			"min",
			"name",
			"numoctaves",
			"offset",
			"operator",
			"opacity",
			"order",
			"orient",
			"orientation",
			"origin",
			"overflow",
			"paint-order",
			"path",
			"pathlength",
			"patterncontentunits",
			"patterntransform",
			"patternunits",
			"pointer-events",
			"points",
			"preservealpha",
			"preserveaspectratio",
			"primitiveunits",
			"r",
			"rx",
			"ry",
			"radius",
			"refx",
			"refy",
			"repeatcount",
			"repeatdur",
			"restart",
			"result",
			"rotate",
			"scale",
			"seed",
			"shape-rendering",
			"slope",
			"specularconstant",
			"specularexponent",
			"spreadmethod",
			"startoffset",
			"stddeviation",
			"stitchtiles",
			"stop-color",
			"stop-opacity",
			"stroke-dasharray",
			"stroke-dashoffset",
			"stroke-linecap",
			"stroke-linejoin",
			"stroke-miterlimit",
			"stroke-opacity",
			"stroke",
			"stroke-width",
			"style",
			"surfacescale",
			"systemlanguage",
			"tabindex",
			"tablevalues",
			"targetx",
			"targety",
			"transform",
			"transform-origin",
			"text-anchor",
			"text-decoration",
			"text-orientation",
			"text-rendering",
			"textlength",
			"type",
			"u1",
			"u2",
			"unicode",
			"values",
			"vector-effect",
			"viewbox",
			"visibility",
			"version",
			"vert-adv-y",
			"vert-origin-x",
			"vert-origin-y",
			"width",
			"word-spacing",
			"wrap",
			"writing-mode",
			"xchannelselector",
			"ychannelselector",
			"x",
			"x1",
			"x2",
			"xmlns",
			"y",
			"y1",
			"y2",
			"z",
			"zoomandpan"
		]);
		const mathMl = freeze([
			"accent",
			"accentunder",
			"align",
			"bevelled",
			"close",
			"columnalign",
			"columnlines",
			"columnspacing",
			"columnspan",
			"denomalign",
			"depth",
			"dir",
			"display",
			"displaystyle",
			"encoding",
			"fence",
			"frame",
			"height",
			"href",
			"id",
			"largeop",
			"length",
			"linethickness",
			"lquote",
			"lspace",
			"mathbackground",
			"mathcolor",
			"mathsize",
			"mathvariant",
			"maxsize",
			"minsize",
			"movablelimits",
			"notation",
			"numalign",
			"open",
			"rowalign",
			"rowlines",
			"rowspacing",
			"rowspan",
			"rspace",
			"rquote",
			"scriptlevel",
			"scriptminsize",
			"scriptsizemultiplier",
			"selection",
			"separator",
			"separators",
			"stretchy",
			"subscriptshift",
			"supscriptshift",
			"symmetric",
			"voffset",
			"width",
			"xmlns"
		]);
		const xml = freeze([
			"xlink:href",
			"xml:id",
			"xlink:title",
			"xml:space",
			"xmlns:xlink"
		]);
		const MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
		const ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
		const TMPLIT_EXPR = seal(/\${[\w\W]*/g);
		const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
		const ARIA_ATTR = seal(/^aria-[\-\w]+$/);
		const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i);
		const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
		const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g);
		const DOCTYPE_NAME = seal(/^html$/i);
		const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
		const ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
		const COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
		const FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
		const SELF_CLOSING_TAG = seal(/\/>/i);
		const NODE_TYPE = {
			element: 1,
			attribute: 2,
			text: 3,
			cdataSection: 4,
			entityReference: 5,
			entityNode: 6,
			processingInstruction: 7,
			comment: 8,
			document: 9,
			documentType: 10,
			documentFragment: 11,
			notation: 12
		};
		const LITERAL_TEXT_ELEMENT_NAMES = [
			"style",
			"script",
			"xmp",
			"iframe",
			"noembed",
			"noframes",
			"plaintext",
			"noscript"
		];
		const LITERAL_TEXT_ELEMENTS = freeze(addToSet({}, LITERAL_TEXT_ELEMENT_NAMES));
		const LITERAL_TEXT_CLOSE = function() {
			const map = {};
			arrayForEach(LITERAL_TEXT_ELEMENT_NAMES, (name) => {
				map[name] = seal(new RegExp("</" + name + "(?=[\\t\\n\\f\\r />])", "i"));
			});
			return freeze(map);
		}();
		const getGlobal = function getGlobal() {
			return typeof window === "undefined" ? null : window;
		};
		/**
		* Creates a no-op policy for internal use only.
		* Don't export this function outside this module!
		* @param trustedTypes The policy factory.
		* @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
		* @return The policy created (or null, if Trusted Types
		* are not supported or creating the policy failed).
		*/
		const _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
			if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") return null;
			let suffix = null;
			const ATTR_NAME = "data-tt-policy-suffix";
			if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) suffix = purifyHostElement.getAttribute(ATTR_NAME);
			const policyName = "dompurify" + (suffix ? "#" + suffix : "");
			try {
				return trustedTypes.createPolicy(policyName, {
					createHTML(html) {
						return html;
					},
					createScriptURL(scriptUrl) {
						return scriptUrl;
					}
				});
			} catch (_) {
				console.warn("TrustedTypes policy " + policyName + " could not be created.");
				return null;
			}
		};
		const _createHooksMap = function _createHooksMap() {
			return {
				afterSanitizeAttributes: [],
				afterSanitizeElements: [],
				afterSanitizeShadowDOM: [],
				beforeSanitizeAttributes: [],
				beforeSanitizeElements: [],
				beforeSanitizeShadowDOM: [],
				uponSanitizeAttribute: [],
				uponSanitizeElement: [],
				uponSanitizeShadowNode: []
			};
		};
		/**
		* Resolve a set-valued configuration option: a fresh set built from
		* cfg[key] when it is an own array property (seeded with a clone of
		* options.base when given, case-normalized via options.transform),
		* the fallback set otherwise.
		*
		* @param cfg the cloned, prototype-free configuration object
		* @param key the configuration property to read
		* @param fallback the set to use when the option is absent or not an array
		* @param options transform and optional base set to merge into
		* @returns the resolved set
		*/
		const _resolveSetOption = function _resolveSetOption(cfg, key, fallback, options) {
			return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
		};
		/**
		* Resolve an object-valued configuration option: a prototype-free clone
		* of cfg[key] when it is an own, truthy object property, else a fresh
		* fallback built by makeFallback (fresh on every parse, so a previous
		* parse can never leak state into the next one).
		*
		* @param cfg the cloned, prototype-free configuration object
		* @param key the configuration property to read
		* @param makeFallback builds the fallback value when the option is absent
		* @returns the resolved object
		*/
		const _resolveObjectOption = function _resolveObjectOption(cfg, key, makeFallback) {
			const value = objectHasOwnProperty(cfg, key) ? cfg[key] : void 0;
			return value && typeof value === "object" ? clone(value) : makeFallback();
		};
		function createDOMPurify() {
			let window = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
			const DOMPurify = (root) => createDOMPurify(root);
			DOMPurify.version = "3.4.14";
			DOMPurify.removed = [];
			if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
				DOMPurify.isSupported = false;
				return DOMPurify;
			}
			let document = window.document;
			const originalDocument = document;
			const currentScript = originalDocument.currentScript;
			window.DocumentFragment;
			const HTMLTemplateElement = window.HTMLTemplateElement, Node = window.Node, Element = window.Element, NodeFilter = window.NodeFilter;
			window.NamedNodeMap === void 0 && (window.NamedNodeMap || window.MozNamedAttrMap);
			window.HTMLFormElement;
			const DOMParser = window.DOMParser, trustedTypes = window.trustedTypes;
			const ElementPrototype = Element.prototype;
			const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
			const remove = lookupGetter(ElementPrototype, "remove");
			const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
			const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
			const getParentNode = lookupGetter(ElementPrototype, "parentNode");
			const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
			const getAttributes = lookupGetter(ElementPrototype, "attributes");
			const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
			const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
			const getOwnerDocument = Node && Node.prototype ? lookupGetter(Node.prototype, "ownerDocument") : null;
			const _readNodeType = function _readNodeType(node) {
				return getNodeType ? getNodeType(node) : node.nodeType;
			};
			const _readNodeName = function _readNodeName(node) {
				return getNodeName ? getNodeName(node) : node.nodeName;
			};
			if (typeof HTMLTemplateElement === "function") {
				const template = document.createElement("template");
				if (template.content && template.content.ownerDocument) document = template.content.ownerDocument;
			}
			let trustedTypesPolicy;
			let emptyHTML = "";
			let defaultTrustedTypesPolicy;
			let defaultTrustedTypesPolicyResolved = false;
			let IN_TRUSTED_TYPES_POLICY = 0;
			const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy() {
				if (IN_TRUSTED_TYPES_POLICY > 0) throw typeErrorCreate("A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the \"DOMPurify and Trusted Types\" section of the README.");
			};
			const _createTrustedHTML = function _createTrustedHTML(html) {
				_assertNotInTrustedTypesPolicy();
				IN_TRUSTED_TYPES_POLICY++;
				try {
					return trustedTypesPolicy.createHTML(html);
				} finally {
					IN_TRUSTED_TYPES_POLICY--;
				}
			};
			const _createTrustedScriptURL = function _createTrustedScriptURL(scriptUrl) {
				_assertNotInTrustedTypesPolicy();
				IN_TRUSTED_TYPES_POLICY++;
				try {
					return trustedTypesPolicy.createScriptURL(scriptUrl);
				} finally {
					IN_TRUSTED_TYPES_POLICY--;
				}
			};
			const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy() {
				if (!defaultTrustedTypesPolicyResolved) {
					defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
					defaultTrustedTypesPolicyResolved = true;
				}
				return defaultTrustedTypesPolicy;
			};
			const _document = document, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
			const importNode = originalDocument.importNode;
			let hooks = _createHooksMap();
			/**
			* Expose whether this browser supports running the full DOMPurify.
			*/
			DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
			const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
			let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
			/**
			* We consider the elements and attributes below to be safe. Ideally
			* don't add any new ones but feel free to remove unwanted ones.
			*/
			let ALLOWED_TAGS = null;
			const DEFAULT_ALLOWED_TAGS = addToSet({}, [
				...html$1,
				...svg$1,
				...svgFilters,
				...mathMl$1,
				...text
			]);
			let ALLOWED_ATTR = null;
			const DEFAULT_ALLOWED_ATTR = addToSet({}, [
				...html,
				...svg,
				...mathMl,
				...xml
			]);
			let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
				tagNameCheck: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: null
				},
				attributeNameCheck: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: null
				},
				allowCustomizedBuiltInElements: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: false
				}
			}));
			let FORBID_TAGS = null;
			let FORBID_ATTR = null;
			const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
				tagCheck: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: null
				},
				attributeCheck: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: null
				}
			}));
			let ALLOW_ARIA_ATTR = true;
			let ALLOW_DATA_ATTR = true;
			let ALLOW_UNKNOWN_PROTOCOLS = false;
			let ALLOW_SELF_CLOSE_IN_ATTR = true;
			let SAFE_FOR_TEMPLATES = false;
			let SAFE_FOR_XML = true;
			let WHOLE_DOCUMENT = false;
			let SET_CONFIG = false;
			let SET_CONFIG_ALLOWED_TAGS = null;
			let SET_CONFIG_ALLOWED_ATTR = null;
			let FORCE_BODY = false;
			let RETURN_DOM = false;
			let RETURN_DOM_FRAGMENT = false;
			let RETURN_TRUSTED_TYPE = false;
			let SANITIZE_DOM = true;
			let SANITIZE_NAMED_PROPS = false;
			const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
			let KEEP_CONTENT = true;
			let IN_PLACE = false;
			let USE_PROFILES = {};
			let FORBID_CONTENTS = null;
			const DEFAULT_FORBID_CONTENTS = addToSet({}, [
				"annotation-xml",
				"audio",
				"colgroup",
				"desc",
				"foreignobject",
				"head",
				"iframe",
				"math",
				"mi",
				"mn",
				"mo",
				"ms",
				"mtext",
				"noembed",
				"noframes",
				"noscript",
				"plaintext",
				"script",
				"selectedcontent",
				"style",
				"svg",
				"template",
				"thead",
				"title",
				"video",
				"xmp"
			]);
			let DATA_URI_TAGS = null;
			const DEFAULT_DATA_URI_TAGS = addToSet({}, [
				"audio",
				"video",
				"img",
				"source",
				"image",
				"track"
			]);
			let URI_SAFE_ATTRIBUTES = null;
			const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
				"alt",
				"class",
				"for",
				"id",
				"label",
				"name",
				"pattern",
				"placeholder",
				"role",
				"summary",
				"title",
				"value",
				"style",
				"xmlns"
			]);
			const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
			const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
			const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
			let NAMESPACE = HTML_NAMESPACE;
			let IS_EMPTY_INPUT = false;
			let ALLOWED_NAMESPACES = null;
			const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [
				MATHML_NAMESPACE,
				SVG_NAMESPACE,
				HTML_NAMESPACE
			], stringToString);
			const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze([
				"mi",
				"mo",
				"mn",
				"ms",
				"mtext"
			]);
			let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
			const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
			let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
			const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, [
				"title",
				"style",
				"font",
				"a",
				"script"
			]);
			let PARSER_MEDIA_TYPE = null;
			const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
			const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
			let transformCaseFunc = null;
			let CONFIG = null;
			const formElement = document.createElement("form");
			const isRegexOrFunction = function isRegexOrFunction(testValue) {
				return testValue instanceof RegExp || testValue instanceof Function;
			};
			/**
			* _parseConfig
			*
			* @param cfg optional config literal
			*/
			const _parseConfig = function _parseConfig() {
				let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
				if (CONFIG && CONFIG === cfg) return;
				if (!cfg || typeof cfg !== "object") cfg = {};
				cfg = clone(cfg);
				PARSER_MEDIA_TYPE = SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
				transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
				ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, { transform: transformCaseFunc });
				ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, { transform: transformCaseFunc });
				ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, { transform: stringToString });
				URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
					transform: transformCaseFunc,
					base: DEFAULT_URI_SAFE_ATTRIBUTES
				});
				DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
					transform: transformCaseFunc,
					base: DEFAULT_DATA_URI_TAGS
				});
				FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, { transform: transformCaseFunc });
				FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone({}), { transform: transformCaseFunc });
				FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone({}), { transform: transformCaseFunc });
				USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
				ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
				ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
				ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
				ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
				SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
				SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
				WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
				RETURN_DOM = cfg.RETURN_DOM || false;
				RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
				RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
				FORCE_BODY = cfg.FORCE_BODY || false;
				SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
				SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
				KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
				IN_PLACE = cfg.IN_PLACE || false;
				IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
				NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
				MATHML_TEXT_INTEGRATION_POINTS = _resolveObjectOption(cfg, "MATHML_TEXT_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS));
				HTML_INTEGRATION_POINTS = _resolveObjectOption(cfg, "HTML_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS));
				const customElementHandling = _resolveObjectOption(cfg, "CUSTOM_ELEMENT_HANDLING", () => create(null));
				CUSTOM_ELEMENT_HANDLING = create(null);
				if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
				if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
				if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
				seal(CUSTOM_ELEMENT_HANDLING);
				if (SAFE_FOR_TEMPLATES) ALLOW_DATA_ATTR = false;
				if (RETURN_DOM_FRAGMENT) RETURN_DOM = true;
				if (USE_PROFILES) {
					ALLOWED_TAGS = addToSet({}, text);
					ALLOWED_ATTR = create(null);
					if (USE_PROFILES.html === true) {
						addToSet(ALLOWED_TAGS, html$1);
						addToSet(ALLOWED_ATTR, html);
					}
					if (USE_PROFILES.svg === true) {
						addToSet(ALLOWED_TAGS, svg$1);
						addToSet(ALLOWED_ATTR, svg);
						addToSet(ALLOWED_ATTR, xml);
					}
					if (USE_PROFILES.svgFilters === true) {
						addToSet(ALLOWED_TAGS, svgFilters);
						addToSet(ALLOWED_ATTR, svg);
						addToSet(ALLOWED_ATTR, xml);
					}
					if (USE_PROFILES.mathMl === true) {
						addToSet(ALLOWED_TAGS, mathMl$1);
						addToSet(ALLOWED_ATTR, mathMl);
						addToSet(ALLOWED_ATTR, xml);
					}
				}
				EXTRA_ELEMENT_HANDLING.tagCheck = null;
				EXTRA_ELEMENT_HANDLING.attributeCheck = null;
				if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
					if (typeof cfg.ADD_TAGS === "function") EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
					else if (arrayIsArray(cfg.ADD_TAGS)) {
						if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) ALLOWED_TAGS = clone(ALLOWED_TAGS);
						addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
					}
				}
				if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
					if (typeof cfg.ADD_ATTR === "function") EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
					else if (arrayIsArray(cfg.ADD_ATTR)) {
						if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) ALLOWED_ATTR = clone(ALLOWED_ATTR);
						addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
					}
				}
				if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
					if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
					addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
				}
				if (KEEP_CONTENT) ALLOWED_TAGS["#text"] = true;
				if (WHOLE_DOCUMENT) addToSet(ALLOWED_TAGS, [
					"html",
					"head",
					"body"
				]);
				if (ALLOWED_TAGS.table) {
					addToSet(ALLOWED_TAGS, ["tbody"]);
					delete FORBID_TAGS.tbody;
				}
				if (cfg.TRUSTED_TYPES_POLICY) {
					if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
					if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
					const previousTrustedTypesPolicy = trustedTypesPolicy;
					trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
					try {
						emptyHTML = _createTrustedHTML("");
					} catch (error) {
						trustedTypesPolicy = previousTrustedTypesPolicy;
						throw error;
					}
				} else if (cfg.TRUSTED_TYPES_POLICY === null) {
					trustedTypesPolicy = void 0;
					emptyHTML = "";
				} else {
					if (trustedTypesPolicy === void 0) trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
					if (trustedTypesPolicy && typeof emptyHTML === "string") emptyHTML = _createTrustedHTML("");
				}
				if (freeze) freeze(cfg);
				CONFIG = cfg;
			};
			const ALL_SVG_TAGS = addToSet({}, [
				...svg$1,
				...svgFilters,
				...svgDisallowed
			]);
			const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
			/**
			* Namespace rules for an element in the SVG namespace.
			*
			* @param tagName the element's lowercase tag name
			* @param parent the (possibly simulated) parent node
			* @param parentTagName the parent's lowercase tag name
			* @returns true if a spec-compliant parser could produce this element
			*/
			const _checkSvgNamespace = function _checkSvgNamespace(tagName, parent, parentTagName) {
				if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "svg";
				if (parent.namespaceURI === MATHML_NAMESPACE) return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
				return Boolean(ALL_SVG_TAGS[tagName]);
			};
			/**
			* Namespace rules for an element in the MathML namespace.
			*
			* @param tagName the element's lowercase tag name
			* @param parent the (possibly simulated) parent node
			* @param parentTagName the parent's lowercase tag name
			* @returns true if a spec-compliant parser could produce this element
			*/
			const _checkMathMlNamespace = function _checkMathMlNamespace(tagName, parent, parentTagName) {
				if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "math";
				if (parent.namespaceURI === SVG_NAMESPACE) return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
				return Boolean(ALL_MATHML_TAGS[tagName]);
			};
			/**
			* Namespace rules for an element in the HTML namespace.
			*
			* @param tagName the element's lowercase tag name
			* @param parent the (possibly simulated) parent node
			* @param parentTagName the parent's lowercase tag name
			* @returns true if a spec-compliant parser could produce this element
			*/
			const _checkHtmlNamespace = function _checkHtmlNamespace(tagName, parent, parentTagName) {
				if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) return false;
				if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) return false;
				return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
			};
			/**
			* @param element a DOM element whose namespace is being checked
			* @returns Return false if the element has a
			*  namespace that a spec-compliant parser would never
			*  return. Return true otherwise.
			*/
			const _checkValidNamespace = function _checkValidNamespace(element) {
				let parent = getParentNode(element);
				if (!parent || !parent.tagName) parent = {
					namespaceURI: NAMESPACE,
					tagName: "template"
				};
				const tagName = stringToLowerCase(element.tagName);
				const parentTagName = stringToLowerCase(parent.tagName);
				if (!ALLOWED_NAMESPACES[element.namespaceURI]) return false;
				if (element.namespaceURI === SVG_NAMESPACE) return _checkSvgNamespace(tagName, parent, parentTagName);
				if (element.namespaceURI === MATHML_NAMESPACE) return _checkMathMlNamespace(tagName, parent, parentTagName);
				if (element.namespaceURI === HTML_NAMESPACE) return _checkHtmlNamespace(tagName, parent, parentTagName);
				if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) return true;
				return false;
			};
			/**
			* _forceRemove
			*
			* @param node a DOM node
			*/
			const _forceRemove = function _forceRemove(node) {
				arrayPush(DOMPurify.removed, { element: node });
				try {
					getParentNode(node).removeChild(node);
				} catch (_) {
					remove(node);
					if (!getParentNode(node)) throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
				}
			};
			/**
			* _stripAttributeNode
			*
			* Remove a single Attr node case/namespace-exactly on an attribute-teardown
			* path. Name-based removeAttribute() ASCII-lowercases its lookup key for an
			* HTML element in an HTML document and so silently misses a case-preserved
			* handler (e.g. `ONERROR` off an XML/XHTML import) - the same defect
			* _removeAttribute() was fixed for, which a name-based call would reintroduce
			* on these IN_PLACE teardown paths. Unlike _removeAttribute this does not
			* record into DOMPurify.removed: the neutralize passes intentionally do not
			* book-keep. A clobbered/detached node falls back to best-effort name-based
			* removal.
			*
			* @param element the element to strip the attribute from
			* @param attribute the Attr node to remove
			* @param name the attribute's name, for the fallback path
			*/
			const _stripAttributeNode = function _stripAttributeNode(element, attribute, name) {
				try {
					element.removeAttributeNode(attribute);
				} catch (_) {
					try {
						element.removeAttribute(name);
					} catch (_) {}
				}
			};
			/**
			* _neutralizeRoot
			*
			* Fail-closed teardown of an in-place root after the sanitize walk aborts
			* (campaign-3 F2). An internal throw mid-walk — e.g. a page-registered
			* custom element's reaction detaches a node so `_forceRemove`'s deliberate
			* parentless guard throws, or any other re-entrant engine mutation — would
			* otherwise leave the caller's *live* tree half-sanitized, with everything
			* after the abort point still carrying its handlers. There is no safe way
			* to resume the walk (the tree mutated under us), so we strip the root bare:
			* remove every child and every attribute, then let the caller's catch see
			* the original error. Clobber-safe (cached `remove`/`childNodes`/`attributes`
			* getters; the root was already clobber-pre-flighted at the IN_PLACE entry).
			*
			* @param root the in-place root to empty
			*/
			const _neutralizeRoot = function _neutralizeRoot(root) {
				_neutralizeSubtree(root);
				const childNodes = getChildNodes(root);
				if (childNodes) {
					const snapshot = [];
					arrayForEach(childNodes, (child) => {
						arrayPush(snapshot, child);
					});
					arrayForEach(snapshot, (child) => {
						try {
							remove(child);
						} catch (_) {}
					});
				}
				const attributes = getAttributes(root);
				if (attributes) for (let i = attributes.length - 1; i >= 0; --i) {
					const attribute = attributes[i];
					const name = attribute && attribute.name;
					if (typeof name === "string") _stripAttributeNode(root, attribute, name);
				}
			};
			/**
			* _removeAttribute
			*
			* Name-based getAttributeNode()/removeAttribute() ASCII-lowercase their
			* lookup key for HTML elements in an HTML document, so they silently miss an
			* attribute whose stored qualified name still contains uppercase ASCII
			* letters. That happens when the node came from a case-preserving source
			* (an XML/XHTML document imported via importNode(), or createAttributeNS()),
			* where e.g. `ONERROR` survives the walk: the policy check lowercases to
			* `onerror` and rejects it, but `removeAttribute('ONERROR')` looks up
			* `onerror` and finds nothing. Remove the exact Attr node instead, which is
			* case- and namespace-exact, and fall back to name-based removal only when
			* the caller could not supply the node.
			*
			* @param name an Attribute name
			* @param element a DOM node
			* @param attr the exact Attr node to remove, when the caller has it
			*/
			const _removeAttribute = function _removeAttribute(name, element, attr) {
				if (!attr) try {
					attr = element.getAttributeNode(name);
				} catch (_) {
					attr = null;
				}
				arrayPush(DOMPurify.removed, {
					attribute: attr || null,
					from: element
				});
				try {
					if (attr) element.removeAttributeNode(attr);
					else element.removeAttribute(name);
				} catch (_) {
					try {
						element.removeAttribute(name);
					} catch (_) {}
				}
				if (name === "is") {
					if (RETURN_DOM || RETURN_DOM_FRAGMENT) try {
						_forceRemove(element);
					} catch (_) {}
					else try {
						element.setAttribute(name, "");
					} catch (_) {}
				}
			};
			/**
			* _stripDisallowedAttributes
			*
			* Removes every attribute the active configuration does not allow from a
			* single element, using the same allowlist as the main attribute pass (so
			* `on*` handlers go, but no `/^on/` blocklist is introduced). Used only to
			* neutralise nodes that are being discarded from an in-place tree.
			*
			* @param element the element to strip
			*/
			const _stripDisallowedAttributes = function _stripDisallowedAttributes(element) {
				const attributes = getAttributes(element);
				if (!attributes) return;
				for (let i = attributes.length - 1; i >= 0; --i) {
					const attribute = attributes[i];
					const name = attribute && attribute.name;
					if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) continue;
					_stripAttributeNode(element, attribute, name);
				}
			};
			/**
			* _neutralizeSubtree
			*
			* Completes the audit-5 F1 fix across every removal path. The KEEP_CONTENT
			* move-hoist neutralises only disallowed-tag removals; clobber, mXSS-canary,
			* namespace, comment, processing-instruction and KEEP_CONTENT:false removals
			* all drop their subtree wholesale via `_forceRemove`. On the IN_PLACE path
			* those dropped nodes are detached from the caller's LIVE tree but a
			* handler-bearing original among them (an `<img onerror>`/`<video>` that was
			* loading) keeps its queued resource event, which fires in page scope after
			* sanitize returns. This walks a removed subtree and strips every attribute
			* the active configuration does not allow — so `on*` handlers are cancelled
			* through the SAME allowlist that governs kept nodes, not a separate `/^on/`
			* blocklist. Run synchronously before sanitize returns, i.e. before any
			* queued event can fire. Hook-free by design: these nodes leave the output,
			* so firing attribute hooks for them would be surprising. Clobber-safe reads;
			* a doomed clobbered node may shadow `removeAttribute` (its own attributes are
			* irrelevant — it is discarded — while its non-clobbered descendants, e.g.
			* the `<img>`, are reached and scrubbed).
			*
			* @param root the root of a removed subtree to neutralise
			*/
			const _neutralizeSubtree = function _neutralizeSubtree(root) {
				const stack = [root];
				while (stack.length > 0) {
					const node = stack.pop();
					if (_readNodeType(node) === NODE_TYPE.element) _stripDisallowedAttributes(node);
					const childNodes = getChildNodes(node);
					if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push(childNodes[i]);
				}
			};
			/**
			* _neutralizePatchLinkage
			*
			* IN_PLACE entry pre-pass (declarative-partial-updates / streaming
			* hardening, https://github.com/WICG/declarative-partial-updates).
			*
			* The main walk strips patch linkage (`for`/`patchsrc`) and removes range
			* markers (PIs / markup comments) node-by-node, in document order, AS it
			* reaches each node. On a live in-place root that leaves a window: from the
			* moment the root is connected until the walk arrives at a given node, that
			* node's linkage is live. A patch applied on connection/stream can fire as
			* a microtask during the walk and inject or teleport an unsanitized DOM
			* range into a region the iterator has already passed and will not revisit,
			* so the post-return "tree is sanitized" contract is violated. Sweep the
			* whole tree once up front and sever every linkage before the walk begins,
			* closing that window.
			*
			* This CANNOT undo a patch that already fired before sanitize ran — that is
			* the irreducible "do not IN_PLACE a live-connected attacker tree" caveat —
			* but it closes everything from sanitize-start onward. Gated on SAFE_FOR_XML
			* to group with the rest of the declarative-partial-updates handling and
			* stay overridable, consistent with the codebase.
			*
			* Clobber-safe traversal (cached childNodes getter); per-node try/catch so a
			* clobbered root cannot defeat the sweep of its non-clobbered descendants.
			*
			* NOTE (pending real-Chrome confirmation, see test/declarative-patch-probe
			* .html Q1): this mirrors the existing policy of keeping `for` on
			* <label>/<output>. If the shipping feature can drive a patch through a
			* surviving `for`-on-label/output + `id` pair, this pre-pass and the
			* attribute check at _isBasicCustomElement's caller must additionally drop
			* that pair on the IN_PLACE path. Left as-is until the taxonomy is verified.
			*
			* @param root the in-place root to sweep
			*/
			/**
			* Central policy for declarative-partial-updates patch-linkage attributes,
			* shared by the _neutralizePatchLinkage pre-pass and _isValidAttribute so
			* the two sites cannot drift: `patchsrc` always links, `for` links
			* everywhere except on <label>/<output>, and the whole policy is gated on
			* SAFE_FOR_XML (see the rationale block in _isValidAttribute).
			*
			* @param lcName the transformCaseFunc'd attribute name
			* @param lcTag the transformCaseFunc'd tag name of the carrying element
			* @return true if the attribute is patch linkage and must be dropped
			*/
			const _isPatchLinkageAttribute = function _isPatchLinkageAttribute(lcName, lcTag) {
				if (!SAFE_FOR_XML) return false;
				if (lcName === "patchsrc") return true;
				return lcName === "for" && lcTag !== "label" && lcTag !== "output";
			};
			const _neutralizePatchLinkage = function _neutralizePatchLinkage(root) {
				if (!SAFE_FOR_XML) return;
				const stack = [root];
				while (stack.length > 0) {
					const node = stack.pop();
					const nodeType = _readNodeType(node);
					if (nodeType === NODE_TYPE.processingInstruction || nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, node.data)) {
						try {
							remove(node);
						} catch (_) {}
						continue;
					}
					if (nodeType === NODE_TYPE.element) {
						const element = node;
						const lcTag = transformCaseFunc(_readNodeName(node));
						try {
							if (element.hasAttribute && element.hasAttribute("patchsrc")) element.removeAttribute("patchsrc");
							if (element.hasAttribute && element.hasAttribute("for") && _isPatchLinkageAttribute("for", lcTag)) element.removeAttribute("for");
						} catch (_) {}
					}
					const childNodes = getChildNodes(node);
					if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push(childNodes[i]);
				}
			};
			/**
			* _initDocument
			*
			* @param dirty - a string of dirty markup
			* @return a DOM, filled with the dirty markup
			*/
			const _initDocument = function _initDocument(dirty) {
				let doc = null;
				let leadingWhitespace = null;
				if (FORCE_BODY) dirty = "<remove></remove>" + dirty;
				else {
					const matches = stringMatch(dirty, /^[\r\n\t ]+/);
					leadingWhitespace = matches && matches[0];
				}
				if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) dirty = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + dirty + "</body></html>";
				const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
				if (NAMESPACE === HTML_NAMESPACE) try {
					doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
				} catch (_) {}
				if (!doc || !doc.documentElement) {
					doc = implementation.createDocument(NAMESPACE, "template", null);
					try {
						doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
					} catch (_) {}
				}
				const body = doc.body || doc.documentElement;
				if (dirty && leadingWhitespace) body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
				if (NAMESPACE === HTML_NAMESPACE) return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
				return WHOLE_DOCUMENT ? doc.documentElement : body;
			};
			/**
			* Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
			*
			* @param root The root element or node to start traversing on.
			* @return The created NodeIterator
			*/
			const _createNodeIterator = function _createNodeIterator(root) {
				const doc = getOwnerDocument ? getOwnerDocument(root) : root.ownerDocument;
				return createNodeIterator.call(doc || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
			};
			/**
			* Replace template expression syntax (mustache, ERB, template
			* literal) with a space; shared by all SAFE_FOR_TEMPLATES scrub
			* sites. Order matters: mustache, then ERB, then template literal.
			*
			* @param value the string to scrub
			* @returns the scrubbed string
			*/
			const _stripTemplateExpressions = function _stripTemplateExpressions(value) {
				value = stringReplace(value, MUSTACHE_EXPR$1, " ");
				value = stringReplace(value, ERB_EXPR$1, " ");
				value = stringReplace(value, TMPLIT_EXPR$1, " ");
				return value;
			};
			/**
			* Strip template-engine expressions ({{...}}, ${...}, <%...%>) from the
			* character data of an element subtree. Used as the final safety net for
			* SAFE_FOR_TEMPLATES on every DOM-returning code path so that expressions
			* which only form after text-node normalization (e.g. fragments split across
			* stripped elements) cannot survive into a template-evaluating framework.
			*
			* Walks text/comment/CDATA/processing-instruction nodes and mutates `.data`
			* in place rather than round-tripping through innerHTML. This preserves
			* descendant node references (important for IN_PLACE callers), avoids a
			* serialize/reparse cycle, and reads literal character data — which means
			* `<%...%>` in text content matches the ERB regex against its real bytes
			* instead of the HTML-entity-escaped form innerHTML would produce.
			*
			* Attribute values are not visited here; SAFE_FOR_TEMPLATES handling for
			* attributes is performed during the per-node `_sanitizeAttributes` pass.
			*
			* @param node The root element whose character data should be scrubbed.
			*/
			const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
				var _node$querySelectorAl;
				node.normalize();
				const doc = getOwnerDocument ? getOwnerDocument(node) : node.ownerDocument;
				const walker = createNodeIterator.call(doc || node, node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION, null);
				let currentNode = walker.nextNode();
				while (currentNode) {
					currentNode.data = _stripTemplateExpressions(currentNode.data);
					currentNode = walker.nextNode();
				}
				const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
				if (templates) arrayForEach(templates, (tmpl) => {
					if (_isDocumentFragment(tmpl.content)) _scrubTemplateExpressions2(tmpl.content);
				});
			};
			/**
			* _isClobbered
			*
			* Detect DOM-clobbering on HTMLFormElement nodes. Form is the only HTML
			* interface with [LegacyOverrideBuiltIns]; a descendant element with a
			* `name` attribute matching a prototype property shadows that property
			* on direct reads. We use this check at the IN_PLACE entry-point and
			* during attribute sanitization to refuse clobbered forms.
			*
			* @param element element to check for clobbering attacks
			* @return true if clobbered, false if safe
			*/
			const _isClobbered = function _isClobbered(element) {
				const realTagName = getNodeName ? getNodeName(element) : null;
				if (typeof realTagName !== "string") return false;
				if (transformCaseFunc(realTagName) !== "form") return false;
				return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || element.nodeType !== getNodeType(element) || element.childNodes !== getChildNodes(element);
			};
			/**
			* Checks whether the given value is a DocumentFragment from any realm.
			*
			* The realm-independent replacement reads `nodeType` through the cached
			* Node.prototype getter and compares to the DOCUMENT_FRAGMENT_NODE
			* constant (11). nodeType is a numeric value resolved from the node's
			* internal slot, identical across realms for the same kind of node.
			*
			* @param value object to check
			* @return true if value is a DocumentFragment-shaped node from any realm
			*/
			const _isDocumentFragment = function _isDocumentFragment(value) {
				if (!getNodeType || typeof value !== "object" || value === null) return false;
				try {
					return getNodeType(value) === NODE_TYPE.documentFragment;
				} catch (_) {
					return false;
				}
			};
			/**
			* Checks whether the given object is a DOM node, including nodes that
			* originate from a different window/realm (e.g. an iframe's
			* contentDocument). The previous `value instanceof Node` check was
			* realm-bound: nodes from a different window failed it, causing
			* sanitize() to silently stringify them and reset IN_PLACE to false,
			* returning the original node unsanitized. See GHSA-4w3q-35jp-p934.
			*
			* @param value object to check whether it's a DOM node
			* @return true if value is a DOM node from any realm
			*/
			const _isNode = function _isNode(value) {
				if (!getNodeType || typeof value !== "object" || value === null) return false;
				try {
					return typeof getNodeType(value) === "number";
				} catch (_) {
					return false;
				}
			};
			function _executeHooks(hooks, currentNode, data) {
				if (hooks.length === 0) return;
				arrayForEach(hooks, (hook) => {
					hook.call(DOMPurify, currentNode, data, CONFIG);
				});
			}
			/**
			* Structural-threat checks that condemn a node regardless of the
			* allowlists: mXSS via namespace confusion, risky CSS construction,
			* processing instructions, markup-bearing comments. Pure predicate;
			* the caller removes. Check order is load-bearing.
			*
			* @param currentNode the node to inspect
			* @param tagName the node's transformCaseFunc'd tag name
			* @return true if the node must be removed
			*/
			const _isUnsafeNode = function _isUnsafeNode(currentNode, tagName) {
				if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) return true;
				if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && LITERAL_TEXT_ELEMENTS[tagName] && (_isNode(currentNode.firstElementChild) || typeof currentNode.textContent === "string" && regExpTest(LITERAL_TEXT_CLOSE[tagName], currentNode.textContent))) return true;
				if (currentNode.nodeType === NODE_TYPE.processingInstruction) return true;
				if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) return true;
				return false;
			};
			/**
			* Evaluate a CUSTOM_ELEMENT_HANDLING check (a RegExp or a predicate
			* function, per the validation in _parseConfig) against a name.
			* Additional arguments are forwarded to predicate functions - the
			* attributeNameCheck predicate receives the tag name as its second
			* argument. A null/absent check never matches.
			*
			* @param check the configured tagNameCheck / attributeNameCheck value
			* @param name the name to test
			* @param args extra arguments forwarded to a predicate function
			* @return true if the check matches the name
			*/
			const _matchesNameCheck = function _matchesNameCheck(check, name) {
				if (check instanceof RegExp) return regExpTest(check, name);
				if (check instanceof Function) {
					for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
					return Boolean(check(name, ...args));
				}
				return false;
			};
			/**
			* Handle a node whose tag is forbidden or not allowlisted: keep
			* allowed custom elements (false return exits _sanitizeElements
			* early - the namespace and fallback-tag removal checks are
			* intentionally skipped for kept custom elements), else hoist
			* content per KEEP_CONTENT and remove.
			*
			* A kept custom element is the ONLY case in which this function
			* returns false, so the caller uses that return value to run the
			* afterSanitizeElements hook on the kept element and keep the
			* element-hook lifecycle consistent with normal allowlisted
			* elements (GHSA-c2j3-45gr-mqc4).
			*
			* @param currentNode the disallowed node
			* @param tagName the node's transformCaseFunc'd tag name
			* @return true if the node was removed, false if kept
			*/
			const _sanitizeDisallowedNode = function _sanitizeDisallowedNode(currentNode, tagName, root) {
				if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) return false;
				if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
					const parentNode = getParentNode(currentNode);
					const childNodes = getChildNodes(currentNode);
					if (childNodes && parentNode) {
						const childCount = childNodes.length;
						for (let i = childCount - 1; i >= 0; --i) {
							const hoisted = currentNode === root ? cloneNode(childNodes[i], true) : childNodes[i];
							parentNode.insertBefore(hoisted, getNextSibling(currentNode));
						}
					}
				}
				_forceRemove(currentNode);
				return true;
			};
			/**
			* Fork a hook-mutable allowlist off its shared binding the first time a
			* (possibly lazily-installed) uponSanitize* hook is about to see it, so the
			* hook cannot widen the per-instance default or the setConfig binding by
			* reference and leak past the call. Returns the set unchanged once it is
			* already call-local, so repeated calls across elements are idempotent.
			*
			* @param hookList the uponSanitize* hook array for this event
			* @param set the current ALLOWED_TAGS / ALLOWED_ATTR binding
			* @param defaultSet the per-instance DEFAULT_ALLOWED_* constant
			* @param setConfigSet the captured setConfig() binding, or null
			* @return a call-local clone if a hook is present and set is still shared,
			*   else set unchanged
			*/
			const _forkSharedAllowlist = function _forkSharedAllowlist(hookList, set, defaultSet, setConfigSet) {
				if (hookList.length === 0) return set;
				return set === defaultSet || set === setConfigSet ? clone(set) : set;
			};
			/**
			* Shared guard for a node that a hook has detached from the walk tree,
			* used after each element-hook site in _sanitizeElements. Detaching is a
			* long-standing user pattern (issue #469; draw.io-style foreignObject
			* filtering). Per the cached, unclobberable parentNode getter the node is
			* genuinely out of the tree, so it can reach neither the serialized
			* output nor an IN_PLACE live tree; treat it as removed and stop
			* processing it. Without this guard, the unsafe-node / namespace checks
			* would call _forceRemove on a parentless node and hit the REPORT-3
			* fail-closed throw — which exists for nodes DOMPurify wants gone but
			* *cannot* detach (clobbered / parentless roots), the opposite of a node
			* that is already safely gone. The walk root is exempt: a detached
			* IN_PLACE root is legitimate input and must still be fully sanitized,
			* and a kill-decision on it must keep hitting the REPORT-3 throw.
			*
			* Nodes detached by hooks stay the hook's responsibility for placement:
			* they are not recorded in DOMPurify.removed, so the post-walk IN_PLACE
			* pass (which iterates DOMPurify.removed) does not reach them. But a
			* hook-detached subtree can still hold a queued resource-event handler -
			* e.g. an <img onload> that began loading when the caller built the live
			* tree - which fires in page scope after sanitize returns even though the
			* handler never reached the returned tree. That is the audit-5 F1 hazard,
			* and the documented node.remove() hook pattern walks straight into it.
			* So on the IN_PLACE path we neutralize the detached subtree inline,
			* stripping its non-allow-listed attributes before returning, exactly as
			* the post-walk pass does for _forceRemove'd subtrees.
			*
			* @param currentNode the node a hook may have detached
			* @param root the current walk root
			* @return true if the node is detached and now handled, false otherwise
			*/
			const _handleHookDetachedNode = function _handleHookDetachedNode(currentNode, root) {
				if (currentNode === root || getParentNode(currentNode) !== null) return false;
				if (IN_PLACE) _neutralizeSubtree(currentNode);
				return true;
			};
			/**
			* _sanitizeElements
			*
			* @protect nodeName
			* @protect textContent
			* @protect removeChild
			* @param currentNode to check for permission to exist
			* @return true if node was killed, false if left alive
			*/
			const _sanitizeElements = function _sanitizeElements(currentNode, root) {
				_executeHooks(hooks.beforeSanitizeElements, currentNode, null);
				if (_handleHookDetachedNode(currentNode, root)) return true;
				if (_isClobbered(currentNode)) {
					_forceRemove(currentNode);
					return true;
				}
				const tagName = transformCaseFunc(_readNodeName(currentNode));
				ALLOWED_TAGS = _forkSharedAllowlist(hooks.uponSanitizeElement, ALLOWED_TAGS, DEFAULT_ALLOWED_TAGS, SET_CONFIG_ALLOWED_TAGS);
				_executeHooks(hooks.uponSanitizeElement, currentNode, {
					tagName,
					allowedTags: ALLOWED_TAGS
				});
				if (_handleHookDetachedNode(currentNode, root)) return true;
				if (_isUnsafeNode(currentNode, tagName)) {
					_forceRemove(currentNode);
					return true;
				}
				if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
					const removed = _sanitizeDisallowedNode(currentNode, tagName, root);
					if (removed === false) _executeHooks(hooks.afterSanitizeElements, currentNode, null);
					return removed;
				}
				if (_readNodeType(currentNode) === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
					_forceRemove(currentNode);
					return true;
				}
				if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
					_forceRemove(currentNode);
					return true;
				}
				if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
					const content = _stripTemplateExpressions(currentNode.textContent);
					if (currentNode.textContent !== content) {
						arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
						currentNode.textContent = content;
					}
				}
				_executeHooks(hooks.afterSanitizeElements, currentNode, null);
				return false;
			};
			/**
			* _isValidAttribute
			*
			* @param lcTag Lowercase tag name of containing element.
			* @param lcName Lowercase attribute name.
			* @param value Attribute value.
			* @return Returns true if `value` is valid, otherwise false.
			*/
			const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
				if (FORBID_ATTR[lcName]) return false;
				if (_isPatchLinkageAttribute(lcName, lcTag)) return false;
				if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document || value in formElement)) return false;
				const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
				if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) return true;
				if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) return true;
				if (!nameIsPermitted) return _isBasicCustomElement(lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName, lcTag) || lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value);
				if (URI_SAFE_ATTRIBUTES[lcName]) return true;
				if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
				if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) return true;
				if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
				return !value;
			};
			const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, [
				"annotation-xml",
				"color-profile",
				"font-face",
				"font-face-format",
				"font-face-name",
				"font-face-src",
				"font-face-uri",
				"missing-glyph"
			]);
			/**
			* _isBasicCustomElement
			* checks if at least one dash is included in tagName, and it's not the first char
			* for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
			*
			* @param tagName name of the tag of the node to sanitize
			* @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
			*/
			const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
				return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
			};
			/**
			* Wrap an attribute value in the matching Trusted Types object when
			* the active policy requires it. Namespaced attributes pass through
			* unchanged (no TT support yet, see
			* https://bugs.chromium.org/p/chromium/issues/detail?id=1305293).
			*
			* @param lcTag lowercase tag name of the containing element
			* @param lcName lowercase attribute name
			* @param namespaceURI the attribute's namespace, if any
			* @param value the attribute value to wrap
			* @return the value, wrapped when Trusted Types demand it
			*/
			const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value) {
				if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) switch (trustedTypes.getAttributeType(lcTag, lcName)) {
					case "TrustedHTML": return _createTrustedHTML(value);
					case "TrustedScriptURL": return _createTrustedScriptURL(value);
				}
				return value;
			};
			/**
			* Write a modified attribute value back onto the element. On
			* success, re-probe for clobbering introduced by the new value and
			* remove the element when found; otherwise pop the removal entry
			* recorded by the earlier _removeAttribute (long-standing pairing
			* with the SANITIZE_NAMED_PROPS path - do not "fix" casually). On
			* failure, remove the attribute instead.
			*
			* @param currentNode the element carrying the attribute
			* @param name the attribute name as present on the element
			* @param namespaceURI the attribute's namespace, if any
			* @param value the new attribute value
			*/
			const _setAttributeValue = function _setAttributeValue(currentNode, name, namespaceURI, value) {
				try {
					if (namespaceURI) currentNode.setAttributeNS(namespaceURI, name, value);
					else currentNode.setAttribute(name, value);
					if (_isClobbered(currentNode)) _forceRemove(currentNode);
					else arrayPop(DOMPurify.removed);
				} catch (_) {
					_removeAttribute(name, currentNode);
				}
			};
			/**
			* _sanitizeAttributes
			*
			* @protect attributes
			* @protect nodeName
			* @protect removeAttribute
			* @protect setAttribute
			*
			* @param currentNode to sanitize
			*/
			const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
				_executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
				const attributes = currentNode.attributes;
				if (!attributes || _isClobbered(currentNode)) return;
				ALLOWED_ATTR = _forkSharedAllowlist(hooks.uponSanitizeAttribute, ALLOWED_ATTR, DEFAULT_ALLOWED_ATTR, SET_CONFIG_ALLOWED_ATTR);
				const hookEvent = {
					attrName: "",
					attrValue: "",
					keepAttr: true,
					allowedAttributes: ALLOWED_ATTR,
					forceKeepAttr: void 0
				};
				let l = attributes.length;
				const lcTag = transformCaseFunc(currentNode.nodeName);
				while (l--) {
					const attr = attributes[l];
					const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
					const lcName = transformCaseFunc(name);
					const initValue = attrValue;
					let value = name === "value" ? initValue : stringTrim(initValue);
					hookEvent.attrName = lcName;
					hookEvent.attrValue = value;
					hookEvent.keepAttr = true;
					hookEvent.forceKeepAttr = void 0;
					_executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
					value = hookEvent.attrValue;
					if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
						_removeAttribute(name, currentNode, attr);
						value = SANITIZE_NAMED_PROPS_PREFIX + value;
					}
					if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
						_removeAttribute(name, currentNode, attr);
						continue;
					}
					if (lcName === "attributename" && stringMatch(value, "href")) {
						_removeAttribute(name, currentNode, attr);
						continue;
					}
					if (hookEvent.forceKeepAttr) continue;
					if (!hookEvent.keepAttr) {
						_removeAttribute(name, currentNode, attr);
						continue;
					}
					if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
						_removeAttribute(name, currentNode, attr);
						continue;
					}
					if (SAFE_FOR_TEMPLATES) value = _stripTemplateExpressions(value);
					if (!_isValidAttribute(lcTag, lcName, value)) {
						_removeAttribute(name, currentNode, attr);
						continue;
					}
					value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
					if (value !== initValue) _setAttributeValue(currentNode, name, namespaceURI, value);
				}
				_executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
			};
			/**
			* _sanitizeShadowDOM
			*
			* @param fragment to iterate over recursively
			*/
			const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
				let shadowNode = null;
				const shadowIterator = _createNodeIterator(fragment);
				_executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
				while (shadowNode = shadowIterator.nextNode()) {
					_executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
					_sanitizeElements(shadowNode, fragment);
					_sanitizeAttributes(shadowNode);
					if (_isDocumentFragment(shadowNode.content)) _sanitizeShadowDOM2(shadowNode.content);
					if (_readNodeType(shadowNode) === NODE_TYPE.element) {
						const innerSr = getShadowRoot(shadowNode);
						if (_isDocumentFragment(innerSr)) {
							_sanitizeAttachedShadowRoots(innerSr);
							_sanitizeShadowDOM2(innerSr);
						}
					}
				}
				_executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
			};
			/**
			* _sanitizeAttachedShadowRoots
			*
			* Walks `root` and feeds every attached shadow root we encounter into
			* the existing _sanitizeShadowDOM pipeline. The default node iterator
			* does not descend into shadow trees, so nodes inside an attached
			* shadow root would otherwise be skipped entirely.
			*
			* Two real input paths put attached shadow roots in front of us:
			*   1. IN_PLACE on a DOM node that already has shadow roots attached.
			*   2. DOM-node input where importNode(dirty, true) deep-clones the
			*      shadow root because it was created with `clonable: true`.
			*
			* This pass runs once, up front, so the main iteration loop (and the
			* existing _sanitizeShadowDOM template-content recursion) stay
			* untouched — string-input paths are not affected.
			*
			* @param root the subtree root to walk for attached shadow roots
			*/
			const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots(root) {
				const stack = [{
					node: root,
					shadow: null
				}];
				while (stack.length > 0) {
					const item = stack.pop();
					if (item.shadow) {
						_sanitizeShadowDOM2(item.shadow);
						continue;
					}
					const node = item.node;
					const isElement = _readNodeType(node) === NODE_TYPE.element;
					const childNodes = getChildNodes(node);
					if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push({
						node: childNodes[i],
						shadow: null
					});
					if (isElement) {
						const rootName = getNodeName ? getNodeName(node) : null;
						if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
							const content = node.content;
							if (_isDocumentFragment(content)) stack.push({
								node: content,
								shadow: null
							});
						}
					}
					if (isElement) {
						const sr = getShadowRoot(node);
						if (_isDocumentFragment(sr)) stack.push({
							node: null,
							shadow: sr
						}, {
							node: sr,
							shadow: null
						});
					}
				}
			};
			DOMPurify.sanitize = function(dirty) {
				let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
				let body = null;
				let importedNode = null;
				let currentNode = null;
				let returnNode = null;
				IS_EMPTY_INPUT = !dirty;
				if (IS_EMPTY_INPUT) dirty = "<!-->";
				if (typeof dirty !== "string" && !_isNode(dirty)) {
					dirty = stringifyValue(dirty);
					if (typeof dirty !== "string") throw typeErrorCreate("dirty is not a string, aborting");
				}
				if (!DOMPurify.isSupported) return dirty;
				if (SET_CONFIG) {
					ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
					ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
				} else _parseConfig(cfg);
				if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) ALLOWED_TAGS = clone(ALLOWED_TAGS);
				if (hooks.uponSanitizeAttribute.length > 0) ALLOWED_ATTR = clone(ALLOWED_ATTR);
				DOMPurify.removed = [];
				const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
				if (inPlace) {
					_neutralizePatchLinkage(dirty);
					const nn = _readNodeName(dirty);
					if (typeof nn === "string") {
						const tagName = transformCaseFunc(nn);
						if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
							_neutralizeRoot(dirty);
							throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
						}
					}
					if (_isClobbered(dirty)) {
						_neutralizeRoot(dirty);
						throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
					}
					try {
						_sanitizeAttachedShadowRoots(dirty);
					} catch (error) {
						_neutralizeRoot(dirty);
						throw error;
					}
				} else if (_isNode(dirty)) {
					body = _initDocument("<!---->");
					importedNode = body.ownerDocument.importNode(dirty, true);
					if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") body = importedNode;
					else if (importedNode.nodeName === "HTML") body = importedNode;
					else body.appendChild(importedNode);
					_sanitizeAttachedShadowRoots(importedNode);
				} else {
					if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && dirty.indexOf("<") === -1) return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
					body = _initDocument(dirty);
					if (!body) return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
				}
				if (body && FORCE_BODY) _forceRemove(body.firstChild);
				const walkRoot = inPlace ? dirty : body;
				try {
					const nodeIterator = _createNodeIterator(walkRoot);
					while (currentNode = nodeIterator.nextNode()) {
						_sanitizeElements(currentNode, walkRoot);
						_sanitizeAttributes(currentNode);
						if (_isDocumentFragment(currentNode.content)) _sanitizeShadowDOM2(currentNode.content);
					}
				} catch (error) {
					if (inPlace) {
						_neutralizeRoot(dirty);
						arrayForEach(DOMPurify.removed, (entry) => {
							if (entry.element) _neutralizeSubtree(entry.element);
						});
					}
					throw error;
				}
				if (inPlace) {
					arrayForEach(DOMPurify.removed, (entry) => {
						if (entry.element) _neutralizeSubtree(entry.element);
					});
					if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(dirty);
					return dirty;
				}
				if (RETURN_DOM) {
					if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(body);
					if (RETURN_DOM_FRAGMENT) {
						returnNode = createDocumentFragment.call(body.ownerDocument);
						while (body.firstChild) returnNode.appendChild(body.firstChild);
					} else returnNode = body;
					if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) returnNode = importNode.call(originalDocument, returnNode, true);
					return returnNode;
				}
				let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
				if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
				if (SAFE_FOR_TEMPLATES) serializedHTML = _stripTemplateExpressions(serializedHTML);
				return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
			};
			DOMPurify.setConfig = function() {
				let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
				_parseConfig(cfg);
				SET_CONFIG = true;
				SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
				SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
			};
			DOMPurify.clearConfig = function() {
				CONFIG = null;
				SET_CONFIG = false;
				SET_CONFIG_ALLOWED_TAGS = null;
				SET_CONFIG_ALLOWED_ATTR = null;
				trustedTypesPolicy = defaultTrustedTypesPolicy;
				emptyHTML = "";
			};
			DOMPurify.isValidAttribute = function(tag, attr, value) {
				if (!CONFIG) _parseConfig({});
				const lcTag = transformCaseFunc(tag);
				const lcName = transformCaseFunc(attr);
				return _isValidAttribute(lcTag, lcName, value);
			};
			DOMPurify.addHook = function(entryPoint, hookFunction) {
				if (typeof hookFunction !== "function") return;
				if (!objectHasOwnProperty(hooks, entryPoint)) return;
				arrayPush(hooks[entryPoint], hookFunction);
			};
			DOMPurify.removeHook = function(entryPoint, hookFunction) {
				if (!objectHasOwnProperty(hooks, entryPoint)) return;
				if (hookFunction !== void 0) {
					const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
					return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
				}
				return arrayPop(hooks[entryPoint]);
			};
			DOMPurify.removeHooks = function(entryPoint) {
				if (!objectHasOwnProperty(hooks, entryPoint)) return;
				hooks[entryPoint] = [];
			};
			DOMPurify.removeAllHooks = function() {
				hooks = _createHooksMap();
			};
			return DOMPurify;
		}
		var purify = createDOMPurify();
		//#endregion
		//#region src/client/markdown.ts
		/**
		* dsh-web-notes Markdown helpers — auto-detection of Markdown text in the note
		* editor and the sanitized preview renderer (marked + DOMPurify, both bundled
		* into the client artifact). Detection is deliberately conservative: plain
		* prose must not trigger the preview/edit toggle, while real Markdown (from
		* pasted AI answers, shell transcripts, notes) does.
		* @module dsh-web-notes/client/markdown
		*/
		/** Configure the renderer once: GFM on, soft line breaks as <br>. */
		d.setOptions({
			gfm: true,
			breaks: true
		});
		/**
		* Conservative Markdown heuristics. Each pattern must be unambiguous enough
		* that everyday notes (commands, credentials, parameter values) stay free of
		* the preview toggle, while headings, lists, code fences, quotes, tables,
		* links, bold/italic and strikethrough light it up.
		*/
		const MD_PATTERNS = [
			/(^|\n)[ \t]{0,3}#{1,6}[ \t]+/,
			/(^|\n)[ \t]{0,3}(```|~~~)/,
			/(^|\n)[ \t]{4}\S/,
			/(^|\n)[ \t]{0,3}>[ \t]?/,
			/(^|\n)[ \t]{0,3}[-*+][ \t]+/,
			/(^|\n)[ \t]{0,3}\d{1,9}[.)][ \t]+/,
			/(^|\n)[ \t]{0,3}([-*_][ \t]*){3,}$/,
			/\[[^\]]+\]\([^)]+\)/,
			/`[^`\n]+`/,
			/(\*\*|__)[^*_\n]+(\*\*|__)/,
			/(?<!\*)\*[^*\n]+\*(?!\*)/,
			/~~[^~\n]+~~/,
			/(^|\n)[ \t]{0,3}\|.*\|/,
			/(^|\n)[ \t]{0,3}\|?[ \t]*:?-{3,}[ \t]*(\|[ \t]*:?-{3,}[ \t]*)*\|?[ \t]*$/
		];
		/** Whether the text looks like Markdown (empty/whitespace text never does). */
		function detectMarkdown(text) {
			if (text.trim() === "") return false;
			for (const pattern of MD_PATTERNS) if (pattern.test(text)) return true;
			return false;
		}
		/** Render Markdown to sanitized HTML for the preview pane (never throws). */
		function renderMarkdown(text) {
			try {
				const html = d.parse(text);
				return purify.sanitize(html, { USE_PROFILES: { html: true } });
			} catch {
				return escapeHtml(text);
			}
		}
		/** Escape plain text for safe inline HTML fallback. */
		function escapeHtml(text) {
			return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;");
		}
		//#endregion
		//#region src/client/NotesPanel.tsx
		/**
		* Notes panel — the slide-over surface listing every note, searching them,
		* and editing/creating notes. Insert/copy actions live on each list item.
		* @module dsh-web-notes/client/NotesPanel
		*/
		const SEARCH_DEBOUNCE_MS = 300;
		/** The notes panel. */
		function NotesPanel(props) {
			const { api, t, onInsert, onClose, onChanged, seed, onSeedConsumed } = props;
			const sessionId = props.sessionId;
			const [notes, setNotes] = (0, react.useState)(null);
			const [count, setCount] = (0, react.useState)(0);
			const [error, setError] = (0, react.useState)(null);
			const [query, setQuery] = (0, react.useState)("");
			const [scope, setScope] = (0, react.useState)(sessionId === null ? "global" : "all");
			const [editing, setEditing] = (0, react.useState)(null);
			const [saving, setSaving] = (0, react.useState)(false);
			const [toast, setToast] = (0, react.useState)(null);
			const [confirmId, setConfirmId] = (0, react.useState)(null);
			const [mdMode, setMdMode] = (0, react.useState)("edit");
			const searchTimer = (0, react.useRef)(void 0);
			const contentRef = (0, react.useRef)(null);
			const showToast = (0, react.useCallback)((text) => {
				setToast(text);
				window.setTimeout(() => {
					setToast((current) => current === text ? null : current);
				}, 2200);
			}, []);
			const load = (0, react.useCallback)(async (q, activeScope) => {
				try {
					const result = await api.list(q, {
						session: props.sessionId,
						scope: activeScope
					});
					setNotes(result.notes);
					setCount(result.count);
					setError(null);
					onChanged?.(result.count);
				} catch {
					setError("load-failed");
				}
			}, [
				api,
				props.sessionId,
				onChanged
			]);
			(0, react.useEffect)(() => {
				load(query, scope);
			}, [api, sessionId]);
			(0, react.useEffect)(() => {
				if (seed === void 0 || seed === null) return;
				setEditing({
					...seed,
					global: seed.global ?? props.sessionId === null
				});
				setQuery("");
				onSeedConsumed?.();
			}, [seed]);
			const onSearch = (text) => {
				setQuery(text);
				if (searchTimer.current !== void 0) window.clearTimeout(searchTimer.current);
				searchTimer.current = window.setTimeout(() => {
					load(text.trim(), scope);
				}, SEARCH_DEBOUNCE_MS);
			};
			const changeScope = (next) => {
				setScope(next);
				load(query, next);
			};
			(0, react.useEffect)(() => () => {
				if (searchTimer.current !== void 0) window.clearTimeout(searchTimer.current);
			}, []);
			(0, react.useEffect)(() => {
				if (editing !== null) window.setTimeout(() => {
					contentRef.current?.focus();
				}, 30);
			}, [editing]);
			const startNew = (source = "manual") => {
				setEditing({
					title: "",
					content: "",
					tags: "",
					source,
					sessionId: props.sessionId,
					global: props.defaultGlobal || props.sessionId === null
				});
			};
			const startEdit = (note) => {
				setEditing({
					id: note.id,
					title: note.title,
					content: note.content,
					tags: note.tags.join(", "),
					sessionId: note.sessionId ?? null
				});
			};
			const saveEditor = async () => {
				if (editing === null || saving) return;
				const content = editing.content.trim();
				if (content === "") return;
				setSaving(true);
				const tags = editing.tags.split(/[,，]/).map((tag) => tag.trim()).filter((tag) => tag !== "");
				const sessionId = editing.global === true ? null : props.sessionId ?? null;
				try {
					if (editing.id !== void 0) {
						const result = await api.update(editing.id, {
							title: editing.title.trim(),
							content,
							tags,
							sessionId
						});
						if (!result.ok) {
							showToast(result.error);
							setSaving(false);
							return;
						}
					} else {
						const result = await api.create({
							title: editing.title.trim() === "" ? void 0 : editing.title.trim(),
							content,
							tags,
							source: editing.source,
							sessionId
						});
						if (!result.ok) {
							showToast(result.error);
							setSaving(false);
							return;
						}
					}
					setEditing(null);
					setConfirmId(null);
					await load(query, scope);
					showToast(t("notes.item.saved"));
				} catch {
					showToast(t("notes.panel.loadFailed"));
				}
				setSaving(false);
			};
			const removeNote = async (id) => {
				try {
					await api.remove(id);
					setConfirmId(null);
					await load(query, scope);
				} catch {
					showToast(t("notes.panel.loadFailed"));
				}
			};
			const copyNote = async (note) => {
				const text = note.title === "" ? note.content : `${note.title}\n\n${note.content}`;
				try {
					await navigator.clipboard.writeText(text);
					showToast(t("notes.item.copied"));
				} catch {
					showToast(t("notes.item.copyFailed"));
				}
			};
			if (editing !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dshn-panel",
				"data-dsh-notes-panel": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dshn-panel-header",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dshn-editor-back",
							"aria-label": t("notes.editor.cancel"),
							onClick: () => {
								setEditing(null);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
								width: "16",
								height: "16",
								viewBox: "0 0 16 16",
								fill: "none",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: "M10 3L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L10 13",
									stroke: "currentColor",
									strokeWidth: "1.6",
									strokeLinecap: "round",
									strokeLinejoin: "round"
								})
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-editor-title-label",
							children: editing.id !== void 0 ? t("notes.item.edit") : t("notes.panel.new")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-editor",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "dshn-input",
								type: "text",
								value: editing.title,
								placeholder: t("notes.editor.titlePlaceholder"),
								onChange: (event) => {
									setEditing({
										...editing,
										title: event.target.value
									});
								}
							}),
							detectMarkdown(editing.content) ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshn-md-toggle",
								role: "group",
								"aria-label": t("notes.editor.mdMode"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: mdMode === "edit" ? "dshn-md-btn dshn-md-btn-active" : "dshn-md-btn",
									"data-dsh-part": "notes-md-edit",
									onClick: () => {
										setMdMode("edit");
									},
									children: t("notes.editor.mdEdit")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: mdMode === "preview" ? "dshn-md-btn dshn-md-btn-active" : "dshn-md-btn",
									"data-dsh-part": "notes-md-preview-toggle",
									onClick: () => {
										setMdMode("preview");
									},
									children: t("notes.editor.mdPreview")
								})]
							}) : null,
							mdMode === "preview" && detectMarkdown(editing.content) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dshn-md-preview",
								"data-dsh-part": "notes-md-preview",
								role: "region",
								"aria-label": t("notes.editor.mdPreview"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshn-md-body",
									dangerouslySetInnerHTML: { __html: renderMarkdown(editing.content) }
								})
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
								ref: contentRef,
								className: "dshn-input dshn-textarea",
								value: editing.content,
								placeholder: t("notes.editor.contentPlaceholder"),
								onChange: (event) => {
									setEditing({
										...editing,
										content: event.target.value
									});
								},
								onKeyDown: (event) => {
									if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
										event.preventDefault();
										saveEditor();
									}
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "dshn-input",
								type: "text",
								value: editing.tags,
								placeholder: t("notes.editor.tagsPlaceholder"),
								onChange: (event) => {
									setEditing({
										...editing,
										tags: event.target.value
									});
								}
							}),
							props.sessionId !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "dshn-check-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									className: "dshn-check",
									checked: editing.global === true,
									onChange: (event) => {
										setEditing({
											...editing,
											global: event.target.checked
										});
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("notes.editor.globalOnly") })]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshn-editor-footer",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dshn-btn",
									onClick: () => {
										setEditing(null);
									},
									disabled: saving,
									children: t("notes.editor.cancel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dshn-btn dshn-btn-primary",
									onClick: () => {
										saveEditor();
									},
									disabled: saving || editing.content.trim() === "",
									children: saving ? t("notes.editor.saving") : t("notes.editor.save")
								})]
							})
						]
					}),
					toast !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-toast",
						role: "status",
						children: toast
					}) : null
				]
			});
			const list = notes ?? [];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dshn-panel",
				"data-dsh-notes-panel": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dshn-panel-header",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-panel-title",
								children: t("notes.panel.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-panel-count",
								children: count
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dshn-icon-btn",
								"aria-label": t("notes.panel.title"),
								onClick: onClose,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 14 14",
									fill: "none",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
										d: "M3 3L11 11M11 3L3 11",
										stroke: "currentColor",
										strokeWidth: "1.6",
										strokeLinecap: "round"
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-toolbar",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: "dshn-search",
							type: "text",
							value: query,
							placeholder: t("notes.panel.searchPlaceholder"),
							onChange: (event) => {
								onSearch(event.target.value);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dshn-new-btn",
							onClick: () => {
								startNew();
							},
							children: t("notes.panel.new")
						})]
					}),
					props.sessionId !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-scopes",
						role: "tablist",
						"aria-label": t("notes.panel.title"),
						children: [
							"all",
							"session",
							"global"
						].map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": scope === item,
							className: scope === item ? "dshn-scope dshn-scope-active" : "dshn-scope",
							onClick: () => {
								changeScope(item);
							},
							children: t(item === "all" ? "notes.scope.all" : item === "session" ? "notes.scope.session" : "notes.scope.global")
						}, item))
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-scopes dshn-scopes-muted",
						role: "note",
						children: t("notes.scope.globalHint")
					}),
					error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-error",
						role: "status",
						children: t("notes.panel.loadFailed")
					}) : notes === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-loading",
						role: "status",
						children: t("notes.panel.loading")
					}) : list.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshn-empty",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							className: "dshn-empty-icon",
							width: "40",
							height: "40",
							viewBox: "0 0 24 24",
							fill: "none",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M6 3.5C6 2.94772 6.44772 2.5 7 2.5H17C17.5523 2.5 18 2.94772 18 3.5V20.5C18 21.0523 17.5523 21.5 17 21.5H7C6.44772 21.5 6 21.0523 6 20.5V3.5Z",
								stroke: "currentColor",
								strokeWidth: "1.4",
								strokeLinejoin: "round"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M9 6.5H15M9 10H15M9 13.5H12",
								stroke: "currentColor",
								strokeWidth: "1.4",
								strokeLinecap: "round"
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("notes.panel.empty") })]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-list",
						children: list.map((note) => {
							const sourceLabel = note.source === "selection" ? t("notes.source.selection") : note.source === "composer" ? t("notes.source.composer") : t("notes.source.manual");
							const confirmed = confirmId === note.id;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
								className: "dshn-item",
								onClick: () => {
									if (!confirmed) startEdit(note);
								},
								role: "button",
								tabIndex: 0,
								onKeyDown: (event) => {
									if (event.key === "Enter" && !confirmed) startEdit(note);
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dshn-item-actions",
										onClick: (event) => event.stopPropagation(),
										children: confirmed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dshn-action dshn-action-danger",
											onClick: () => {
												removeNote(note.id);
											},
											children: t("notes.confirm.ok")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dshn-action",
											onClick: () => {
												setConfirmId(null);
											},
											children: t("notes.confirm.cancel")
										})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dshn-action",
												title: t("notes.item.insert"),
												onClick: () => {
													showToast(onInsert(note));
												},
												children: t("notes.item.insert")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dshn-action",
												title: t("notes.item.copy"),
												onClick: () => {
													copyNote(note);
												},
												children: t("notes.item.copy")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dshn-action",
												title: t("notes.item.edit"),
												onClick: () => {
													startEdit(note);
												},
												children: t("notes.item.edit")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dshn-action dshn-action-danger",
												title: t("notes.item.delete"),
												onClick: () => {
													setConfirmId(note.id);
												},
												children: t("notes.item.delete")
											})
										] })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dshn-item-title",
										children: note.title
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dshn-item-preview",
										children: note.content
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dshn-item-meta",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dshn-tag dshn-source-tag",
												children: sourceLabel
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: note.sessionId === void 0 ? "dshn-tag dshn-scope-tag dshn-scope-tag-global" : "dshn-tag dshn-scope-tag",
												children: note.sessionId === void 0 ? t("notes.item.globalTag") : t("notes.item.sessionTag")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: relativeTime(note.updatedAt, props.t) })
										]
									}),
									note.tags.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dshn-item-tags",
										children: note.tags.map((tag) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dshn-tag",
											children: ["#", tag]
										}, tag))
									}) : null
								]
							}, note.id);
						})
					}),
					toast !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshn-toast",
						role: "status",
						children: toast
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/settings.ts
		/** Normalize an unknown section value to the UI settings (lenient). */
		function decodeSection(section) {
			if (typeof section !== "object" || section === null) return void 0;
			const value = section;
			return {
				dockMode: value.dockMode === "fixed" ? "fixed" : "floating",
				buttonSize: value.buttonSize === "small" || value.buttonSize === "regular" ? value.buttonSize : "large",
				defaultGlobal: value.defaultGlobal === true
			};
		}
		/** The scope spec the notes client binds against the `notes` namespace. */
		const notesSettingsSpec = {
			namespace: "notes",
			decode: decodeSection
		};
		/** Defaults the UI falls back to while the scope has no accepted section yet. */
		const DEFAULT_UI_SETTINGS = {
			dockMode: "floating",
			buttonSize: "large",
			defaultGlobal: false
		};
		/** Derive the effective settings from a bound scope (never throws). */
		function deriveUiSettings(scope) {
			return scope.getSnapshot().value ?? DEFAULT_UI_SETTINGS;
		}
		//#endregion
		//#region src/client/NotesDock.tsx
		/**
		* Notes dock — the floating entry (right edge, vertically centered), the
		* slide-over panel it toggles, and the text-selection capture bubble that
		* appears when the user selects text on the page (e.g. an AI answer) so it
		* can be saved as a note with one click.
		*
		* Dock interaction: drag to reposition (position persists in localStorage),
		* click to toggle the panel. The selection bubble FOLLOWS the selection while
		* the page scrolls, and hides only when the selection collapses, the user
		* clicks elsewhere on the page, or the window loses focus.
		* @module dsh-web-notes/client/NotesDock
		*/
		/** Dock button size presets in px (large = the original 80 px). */
		const DOCK_SIZES = {
			small: 48,
			regular: 64,
			large: 80
		};
		/** Pointer travel before a press becomes a drag (px). */
		const DRAG_THRESHOLD = 5;
		/** localStorage key for the dragged position. */
		const POS_STORAGE_KEY = "dsh-notes.dock-position";
		/** Viewport inset clamp for the dragged dock (px). */
		const DOCK_INSET = 6;
		/** Inset of the fixed dock from the conversation region's top-right corner (px). */
		const FIXED_INSET = 12;
		/** Anchor of the fixed dock: the conversation message scroll container. */
		const FIXED_ANCHOR = "[data-conversation-scroll]";
		/** Load the persisted dock position; tolerant of corrupt/missing entries. */
		function loadDockPosition() {
			try {
				const raw = localStorage.getItem(POS_STORAGE_KEY);
				if (raw === null) return null;
				const parsed = JSON.parse(raw);
				if (typeof parsed.x === "number" && typeof parsed.y === "number" && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) return {
					x: parsed.x,
					y: parsed.y
				};
			} catch {}
			return null;
		}
		/** Persist the dragged dock position. */
		function saveDockPosition(pos) {
			try {
				localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
			} catch {}
		}
		/** Clamp a dragged coordinate so the dock stays fully inside the viewport. */
		function clampDock(value, limit, size) {
			return Math.min(Math.max(value, DOCK_INSET), Math.max(DOCK_INSET, limit - size - DOCK_INSET));
		}
		/**
		* Notebook icon with a Lottie-style keyframe choreography, driven by a tiny
		* rAF engine (no external animation library): the notebook floats, its cover
		* breathes and nods, the bookmark flutters, two lines draw themselves as a
		* pen travels across them, then the lines fade out and the loop restarts,
		* with a sparkle popping at the end. Theme-adaptive (all fills ride the
		* --dshn-* tokens); honours prefers-reduced-motion (static pose) and pauses
		* on hidden tabs.
		*/
		function NotebookIcon() {
			const centerRef = (0, react.useRef)(null);
			const coverRef = (0, react.useRef)(null);
			const line1Ref = (0, react.useRef)(null);
			const line2Ref = (0, react.useRef)(null);
			const bookmarkRef = (0, react.useRef)(null);
			const penRef = (0, react.useRef)(null);
			const sparkleRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
				const easeInOut = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
				const easeOutBack = (x) => {
					return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
				};
				/** Piecewise keyframe sampling with easing between knots. */
				const sample = (kfs, t, ease) => {
					if (t <= kfs[0][0]) return kfs[0][1];
					for (let i = 1; i < kfs.length; i += 1) {
						const [t0, v0] = kfs[i - 1];
						const [t1, v1] = kfs[i];
						if (t <= t1) {
							const span = t1 - t0 || 1;
							return v0 + (v1 - v0) * ease((t - t0) / span);
						}
					}
					return kfs[kfs.length - 1][1];
				};
				const LOOP_MS = 3200;
				const line1 = [
					[0, 0],
					[1150, 0],
					[1650, 1],
					[2950, 1],
					[3150, 0]
				];
				const line2 = [
					[0, 0],
					[1400, 0],
					[1900, 1],
					[3e3, 1],
					[3200, 0]
				];
				const penTravel = [[1250, 0], [1700, 15.5]];
				const penOpacity = [
					[0, 0],
					[1250, 0],
					[1320, 1],
					[1680, 1],
					[1780, 0],
					[3200, 0]
				];
				const coverScale = [
					[0, 1],
					[600, 1],
					[1800, 1.02],
					[2250, 1],
					[2400, 1],
					[2520, .965],
					[2660, 1],
					[3200, 1]
				];
				const sparkleOpacity = [
					[0, 0],
					[2100, 0],
					[2200, 1],
					[2450, 1],
					[2580, 0],
					[3200, 0]
				];
				const sparkleScale = [
					[0, 0],
					[2200, .4],
					[2300, 1],
					[2450, 1],
					[2580, 0],
					[3200, 0]
				];
				if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
					line1Ref.current?.setAttribute("transform", "scale(1 1)");
					line2Ref.current?.setAttribute("transform", "scale(1 1)");
					return;
				}
				let raf = 0;
				let start = 0;
				let running = true;
				const tick = (now) => {
					if (!running) return;
					if (start === 0) start = now;
					const t = (now - start) % LOOP_MS;
					const cover = sample(coverScale, t, easeInOut);
					coverRef.current?.setAttribute("transform", `scale(1 ${cover.toFixed(4)})`);
					line1Ref.current?.setAttribute("transform", `scale(${sample(line1, t, easeOutCubic).toFixed(4)} 1)`);
					line2Ref.current?.setAttribute("transform", `scale(${sample(line2, t, easeOutCubic).toFixed(4)} 1)`);
					const flutter = Math.sin(t / 1200 * Math.PI * 2) * 5;
					bookmarkRef.current?.setAttribute("transform", `rotate(${flutter.toFixed(2)})`);
					penRef.current?.setAttribute("transform", `translate(${sample(penTravel, t, easeOutCubic).toFixed(2)} 0)`);
					penRef.current?.setAttribute("opacity", sample(penOpacity, t, easeInOut).toFixed(3));
					sparkleRef.current?.setAttribute("transform", `scale(${sample(sparkleScale, t, easeOutBack).toFixed(4)})`);
					sparkleRef.current?.setAttribute("opacity", sample(sparkleOpacity, t, easeInOut).toFixed(3));
					raf = window.requestAnimationFrame(tick);
				};
				const onVisibility = () => {
					if (document.hidden) {
						running = false;
						if (raf !== 0) window.cancelAnimationFrame(raf);
					} else if (!running) {
						running = true;
						start = 0;
						raf = window.requestAnimationFrame(tick);
					}
				};
				raf = window.requestAnimationFrame(tick);
				document.addEventListener("visibilitychange", onVisibility);
				return () => {
					running = false;
					if (raf !== 0) window.cancelAnimationFrame(raf);
					document.removeEventListener("visibilitychange", onVisibility);
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "46",
				height: "46",
				viewBox: "0 0 48 48",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("linearGradient", {
					id: "dshn-notes-cover",
					x1: "8",
					y1: "2",
					x2: "40",
					y2: "46",
					gradientUnits: "userSpaceOnUse",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("stop", {
						offset: "0",
						style: { stopColor: "var(--dshn-primary)" }
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("stop", {
						offset: "1",
						style: { stopColor: "var(--dshn-primary-hover)" }
					})]
				}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
					ref: centerRef,
					transform: "translate(3.1 -0.5)",
					className: "dshn-ani-float",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M12 7 h21 a3 3 0 0 1 3 3 v31 a3 3 0 0 1 -3 3 H12 a3 3 0 0 1 -3 -3 V10 a3 3 0 0 1 3 -3 z",
							style: { fill: "var(--dshn-bg-base)" }
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
							ref: coverRef,
							className: "dshn-ani-cover",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: "M10 4 h22 a4 4 0 0 1 4 4 v32 a4 4 0 0 1 -4 4 H10 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 z",
									fill: "url(#dshn-notes-cover)",
									style: { stroke: "color-mix(in srgb, var(--dshn-primary-contrast) 40%, transparent)" },
									strokeWidth: "0.8"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: "M10 4 h7 v41 H10 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 z",
									style: { fill: "var(--dshn-primary-hover)" },
									opacity: "0.9"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "6.6",
									cy: "10",
									r: "0.9",
									style: { fill: "var(--dshn-primary-contrast)" },
									opacity: "0.85"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "6.6",
									cy: "17",
									r: "0.9",
									style: { fill: "var(--dshn-primary-contrast)" },
									opacity: "0.85"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "6.6",
									cy: "24",
									r: "0.9",
									style: { fill: "var(--dshn-primary-contrast)" },
									opacity: "0.85"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "6.6",
									cy: "31",
									r: "0.9",
									style: { fill: "var(--dshn-primary-contrast)" },
									opacity: "0.85"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "6.6",
									cy: "38",
									r: "0.9",
									style: { fill: "var(--dshn-primary-contrast)" },
									opacity: "0.85"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: "M13.5 26 h14.5 M13.5 32.5 h16.5",
									style: { stroke: "var(--dshn-primary-contrast)" },
									strokeWidth: "1.3",
									strokeLinecap: "round",
									opacity: "0.85"
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("g", {
							ref: line1Ref,
							className: "dshn-ani-line",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M13.5 13 h15.5",
								style: { stroke: "var(--dshn-primary-contrast)" },
								strokeWidth: "1.3",
								strokeLinecap: "round",
								opacity: "0.85"
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("g", {
							ref: line2Ref,
							className: "dshn-ani-line",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M13.5 19.5 h18.5",
								style: { stroke: "var(--dshn-primary-contrast)" },
								strokeWidth: "1.3",
								strokeLinecap: "round",
								opacity: "0.85"
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("g", {
							ref: bookmarkRef,
							className: "dshn-ani-bookmark",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M30 4 v10.5 l-3.6 -2.9 -3.6 2.9 V4 z",
								style: {
									fill: "var(--dsw-static-amber-400, #f5c542)",
									stroke: "var(--dsw-static-amber-600, #e0ac2e)"
								},
								strokeWidth: "0.5",
								strokeLinejoin: "round"
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
							ref: penRef,
							className: "dshn-ani-pen",
							opacity: "0",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M13.2 8.6 l4.4 -4.4",
								style: { stroke: "var(--dshn-primary-contrast)" },
								strokeWidth: "1.7",
								strokeLinecap: "round"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
								cx: "13.2",
								cy: "8.6",
								r: "0.8",
								style: { fill: "var(--dshn-primary-contrast)" }
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("g", {
							ref: sparkleRef,
							className: "dshn-ani-sparkle",
							opacity: "0",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M24 30.5 L25.3 33.7 L28.5 35 L25.3 36.3 L24 39.5 L22.7 36.3 L19.5 35 L22.7 33.7 Z",
								style: { fill: "var(--dsw-static-amber-400, #f5c542)" }
							})
						})
					]
				})]
			});
		}
		/** The floating notes dock. */
		function NotesDock(props) {
			const { api, t, onInsert, selectionCapture, sessions, settingsScope } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const [count, setCount] = (0, react.useState)(0);
			const [seed, setSeed] = (0, react.useState)(null);
			const [selection, setSelection] = (0, react.useState)(null);
			const [pos, setPos] = (0, react.useState)(() => loadDockPosition());
			const [dragging, setDragging] = (0, react.useState)(false);
			const ui = (0, react.useSyncExternalStore)((0, react.useCallback)((listener) => settingsScope.subscribe(listener), [settingsScope]), (0, react.useCallback)(() => deriveUiSettings(settingsScope), [settingsScope]));
			const dockSize = DOCK_SIZES[ui.buttonSize];
			const fixedMode = ui.dockMode === "fixed";
			const [fixedPos, setFixedPos] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!fixedMode) return;
				let timer;
				const measure = () => {
					const anchor = document.querySelector(FIXED_ANCHOR);
					if (anchor instanceof HTMLElement) {
						const rect = anchor.getBoundingClientRect();
						const size = DOCK_SIZES[ui.buttonSize];
						setFixedPos({
							x: rect.right - size - FIXED_INSET,
							y: rect.top + FIXED_INSET
						});
					} else setFixedPos(null);
				};
				measure();
				window.addEventListener("resize", measure);
				const observer = new ResizeObserver(measure);
				const anchor = document.querySelector(FIXED_ANCHOR);
				if (anchor instanceof HTMLElement) observer.observe(anchor);
				timer = window.setInterval(measure, 1500);
				return () => {
					window.removeEventListener("resize", measure);
					observer.disconnect();
					if (timer !== void 0) window.clearInterval(timer);
				};
			}, [fixedMode, ui.buttonSize]);
			const currentSessionId = (0, react.useSyncExternalStore)((0, react.useCallback)((listener) => sessions.list.subscribe(listener), [sessions]), (0, react.useCallback)(() => sessions.list.getSnapshot(), [sessions])).current ?? null;
			const rootRef = (0, react.useRef)(null);
			const dockRef = (0, react.useRef)(null);
			const bubbleRef = (0, react.useRef)(null);
			const selectionRef = (0, react.useRef)(null);
			const posRef = (0, react.useRef)(pos);
			const dragRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				selectionRef.current = selection;
			}, [selection]);
			(0, react.useEffect)(() => {
				posRef.current = pos;
			}, [pos]);
			/** Refresh the badge count for the current context (session notes + global). */
			const refreshCount = (0, react.useCallback)(() => {
				api.list(void 0, {
					session: currentSessionId,
					scope: "all"
				}).then((result) => {
					setCount(result.count);
				}, () => {});
			}, [api, currentSessionId]);
			(0, react.useEffect)(() => {
				refreshCount();
			}, [refreshCount]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onKey = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("keydown", onKey);
				return () => document.removeEventListener("keydown", onKey);
			}, [open]);
			const openWithDraft = (0, react.useCallback)((draft) => {
				setSeed(draft);
				setOpen(true);
			}, []);
			const saveSelection = (0, react.useCallback)((text) => {
				const firstLine = text.split("\n").find((line) => line.trim() !== "") ?? "";
				const title = firstLine.length > 32 ? firstLine.slice(0, 32) + "…" : firstLine;
				setSelection(null);
				openWithDraft({
					title,
					content: text,
					tags: "",
					source: "selection",
					sessionId: currentSessionId,
					global: ui.defaultGlobal || currentSessionId === null
				});
			}, [
				openWithDraft,
				currentSessionId,
				ui.defaultGlobal
			]);
			const clickSuppressed = (0, react.useRef)(false);
			const onPointerDown = (event) => {
				if (event.button !== 0) return;
				clickSuppressed.current = false;
				const button = dockRef.current;
				if (button === null) return;
				const rect = button.getBoundingClientRect();
				dragRef.current = {
					startX: event.clientX,
					startY: event.clientY,
					originX: posRef.current?.x ?? rect.left,
					originY: posRef.current?.y ?? rect.top,
					moved: false
				};
				try {
					button.setPointerCapture(event.pointerId);
				} catch {}
			};
			const onPointerMove = (event) => {
				if (fixedMode) return;
				const state = dragRef.current;
				if (state === null) return;
				const dx = event.clientX - state.startX;
				const dy = event.clientY - state.startY;
				if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
				state.moved = true;
				setDragging(true);
				setPos({
					x: clampDock(state.originX + dx, window.innerWidth, dockSize),
					y: clampDock(state.originY + dy, window.innerHeight, dockSize)
				});
			};
			const endDrag = (event) => {
				if (fixedMode) return;
				const state = dragRef.current;
				dragRef.current = null;
				setDragging(false);
				if (state?.moved) {
					clickSuppressed.current = true;
					const final = {
						x: clampDock(state.originX + (event.clientX - state.startX), window.innerWidth, dockSize),
						y: clampDock(state.originY + (event.clientY - state.startY), window.innerHeight, dockSize)
					};
					posRef.current = final;
					saveDockPosition(final);
				}
			};
			const onClick = () => {
				if (clickSuppressed.current) {
					clickSuppressed.current = false;
					return;
				}
				const next = !open;
				setOpen(next);
				if (next) refreshCount();
			};
			(0, react.useEffect)(() => {
				if (!selectionCapture) return;
				let timer;
				let raf;
				/** Whether a node lives outside the notes UI (selections inside it never capture). */
				const outsideNotesUi = (node) => {
					if (node === null) return true;
					if (node.nodeType === Node.ELEMENT_NODE) {
						if (node.closest?.("[data-dsh-notes-root]") !== null) return false;
					} else if (node.parentElement !== null && node.parentElement.closest("[data-dsh-notes-root]") !== null) return false;
					return true;
				};
				/** Live client rect of the current selection, or null when it has no visual extent. */
				const selectionRect = (sel) => {
					if (sel.rangeCount === 0) return null;
					const rect = sel.getRangeAt(0).getBoundingClientRect();
					return rect.width === 0 && rect.height === 0 ? null : rect;
				};
				/** Place the bubble above the selection's current viewport position. */
				const placeBubble = (sel) => {
					const rect = selectionRect(sel);
					if (rect === null) {
						setSelection(null);
						return;
					}
					const x = Math.min(Math.max(rect.left, 8), window.innerWidth - 150);
					const y = Math.min(Math.max(rect.top - 42, 8), window.innerHeight - 44);
					setSelection({
						text: sel.toString().trim(),
						x,
						y
					});
				};
				const checkSelection = () => {
					const sel = window.getSelection();
					if ((sel?.toString().trim() ?? "") === "" || sel === null || sel.isCollapsed || !outsideNotesUi(sel.anchorNode)) {
						setSelection(null);
						return;
					}
					placeBubble(sel);
				};
				const schedule = () => {
					if (timer !== void 0) window.clearTimeout(timer);
					timer = window.setTimeout(checkSelection, 120);
				};
				const onScroll = () => {
					if (selectionRef.current === null || raf !== void 0) return;
					raf = window.requestAnimationFrame(() => {
						raf = void 0;
						const sel = window.getSelection();
						if (sel === null || sel.isCollapsed || !outsideNotesUi(sel.anchorNode)) {
							setSelection(null);
							return;
						}
						const rect = selectionRect(sel);
						if (rect === null || rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
							setSelection(null);
							return;
						}
						const x = Math.min(Math.max(rect.left, 8), window.innerWidth - 150);
						const y = Math.min(Math.max(rect.top - 42, 8), window.innerHeight - 44);
						setSelection((prev) => prev === null ? prev : {
							...prev,
							x,
							y
						});
					});
				};
				const onPointerDown = (event) => {
					if (event.target instanceof Node && bubbleRef.current?.contains(event.target) === true) return;
					setSelection(null);
				};
				const onBlur = () => {
					setSelection(null);
				};
				const onVisibilityChange = () => {
					if (document.hidden) setSelection(null);
				};
				document.addEventListener("mouseup", schedule);
				document.addEventListener("selectionchange", schedule);
				document.addEventListener("scroll", onScroll, true);
				document.addEventListener("pointerdown", onPointerDown);
				window.addEventListener("blur", onBlur);
				document.addEventListener("visibilitychange", onVisibilityChange);
				return () => {
					if (timer !== void 0) window.clearTimeout(timer);
					if (raf !== void 0) window.cancelAnimationFrame(raf);
					document.removeEventListener("mouseup", schedule);
					document.removeEventListener("selectionchange", schedule);
					document.removeEventListener("scroll", onScroll, true);
					document.removeEventListener("pointerdown", onPointerDown);
					window.removeEventListener("blur", onBlur);
					document.removeEventListener("visibilitychange", onVisibilityChange);
				};
			}, [selectionCapture]);
			const floatingStyle = pos === null ? {
				right: 10,
				top: "50%"
			} : {
				left: pos.x,
				top: pos.y
			};
			const dockStyle = fixedMode ? fixedPos === null ? {
				right: FIXED_INSET,
				top: FIXED_INSET
			} : {
				left: fixedPos.x,
				top: fixedPos.y
			} : floatingStyle;
			const dockClass = [
				"dshn-dock",
				fixedMode ? "dshn-dock-fixed" : pos === null ? "" : "dshn-dock-absolute",
				dragging ? "dshn-dock-dragging" : ""
			].filter(Boolean).join(" ");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				className: "dshn-root",
				"data-dsh-notes-root": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						ref: dockRef,
						type: "button",
						className: dockClass,
						style: dockStyle,
						"aria-label": t("notes.dock.tooltip"),
						"data-dsh-part": "notes-dock",
						"data-mode": ui.dockMode,
						"data-size": ui.buttonSize,
						onPointerDown: fixedMode ? void 0 : onPointerDown,
						onPointerMove: fixedMode ? void 0 : onPointerMove,
						onPointerUp: fixedMode ? void 0 : endDrag,
						onPointerCancel: fixedMode ? void 0 : endDrag,
						onClick,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dshn-dock-inner",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NotebookIcon, {}), count > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-dock-badge",
								children: count > 99 ? "99+" : count
							}) : null]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dshn-dock-tooltip",
							children: t("notes.dock.tooltip")
						})]
					}),
					open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NotesPanel, {
						api,
						t,
						sessionId: currentSessionId,
						defaultGlobal: ui.defaultGlobal,
						onInsert,
						onClose: () => {
							setOpen(false);
						},
						onChanged: setCount,
						seed,
						onSeedConsumed: () => {
							setSeed(null);
						}
					}) : null,
					selection !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						ref: bubbleRef,
						type: "button",
						className: "dshn-selection",
						style: {
							left: selection.x,
							top: selection.y
						},
						onClick: () => {
							saveSelection(selection.text);
						},
						"data-dsh-part": "notes-selection-save",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
							width: "12",
							height: "12",
							viewBox: "0 0 24 24",
							fill: "none",
							style: {
								verticalAlign: "-1px",
								marginRight: 5
							},
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
								d: "M12 5V19M5 12H19",
								stroke: "currentColor",
								strokeWidth: "2.2",
								strokeLinecap: "round"
							})
						}), t("notes.selection.save")]
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/NotesSettingsCard.tsx
		/**
		* Notes settings card — the `notes` entry inside the web settings surface
		* (设置 → 插件 → 插件配置). Rendered through the `settings.plugin.item` slot
		* keyed by the `notes` namespace; every control writes straight back through
		* the bound settings scope, so changes apply to the floating UI live.
		* @module dsh-web-notes/client/NotesSettingsCard
		*/
		/** One select row in the card. */
		function SelectField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "dshn-settings-field",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dshn-settings-label",
						children: props.label
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
						className: "dshn-settings-control",
						"data-dsh-part": props.dataPart,
						value: props.value,
						onChange: (event) => {
							props.onChange(event.target.value);
						},
						children: props.options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: option.value,
							children: option.label
						}, option.value))
					}),
					props.hint !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dshn-settings-hint",
						children: props.hint
					}) : null
				]
			});
		}
		/** The notes plugin card in 设置 → 插件 → 插件配置. */
		function NotesSettingsCard(props) {
			const { scope, notesT } = props;
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot());
			if (snapshot.status === "unavailable") return null;
			const value = snapshot.value ?? DEFAULT_UI_SETTINGS;
			const setDockMode = (next) => {
				scope.set("dockMode", next);
			};
			const setButtonSize = (next) => {
				scope.set("buttonSize", next);
			};
			const setDefaultGlobal = (checked) => {
				if (checked) scope.set("defaultGlobal", true);
				else scope.unset("defaultGlobal");
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: "dshn-settings-card",
				"data-dsh-part": "notes-settings-card",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshn-settings-head",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dshn-settings-name",
						children: notesT("notes.settings.title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dshn-settings-description",
						children: notesT("notes.settings.description")
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshn-settings-body",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
							label: notesT("notes.settings.dockMode"),
							value: value.dockMode,
							dataPart: "notes-setting-dockMode",
							onChange: (next) => {
								setDockMode(next === "fixed" ? "fixed" : "floating");
							},
							options: [{
								value: "floating",
								label: notesT("notes.settings.dockModeFloating")
							}, {
								value: "fixed",
								label: notesT("notes.settings.dockModeFixed")
							}],
							hint: notesT("notes.settings.dockModeHint")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
							label: notesT("notes.settings.buttonSize"),
							value: value.buttonSize,
							dataPart: "notes-setting-buttonSize",
							onChange: (next) => {
								setButtonSize(next === "small" || next === "regular" ? next : "large");
							},
							options: [
								{
									value: "small",
									label: notesT("notes.settings.buttonSizeSmall")
								},
								{
									value: "regular",
									label: notesT("notes.settings.buttonSizeRegular")
								},
								{
									value: "large",
									label: notesT("notes.settings.buttonSizeLarge")
								}
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "dshn-settings-field dshn-settings-check-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dshn-settings-label",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									className: "dshn-check",
									"data-dsh-part": "notes-setting-defaultGlobal",
									checked: value.defaultGlobal,
									onChange: (event) => {
										setDefaultGlobal(event.target.checked);
									}
								}), notesT("notes.settings.defaultGlobal")]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshn-settings-hint",
								children: notesT("notes.settings.defaultGlobalHint")
							})]
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/styles.ts
		/**
		* dsh-web-notes styles — theme-adaptive. Every color rides a local `--dshn-*`
		* variable that maps to the OFFICIAL dsh design tokens (`--dsw-alias-*`,
		* defined by the `dsh-client-ui-theme` plugin on <body>), with the original
		* dark-glass palette as fallback. Because skins (dsh-skins / skin-center)
		* recolor the app by redefining those same tokens, the notes UI follows the
		* official light/dark theme out of the box AND any installed skin — live, no
		* reload. Injected by the client bundle at factory execution; the module
		* loader removes the style tag on unload. All classes are prefixed `dshn-`.
		* @module dsh-web-notes/client/styles
		*/
		const NOTES_CSS = `
.dshn-root {
  /* Official semantic tokens → local aliases (fallback = original palette).
     The tokens resolve from the active theme/skin at runtime. */
  --dshn-bg-1: var(--dsw-alias-bg-layer-1, #131c36);
  --dshn-bg-2: var(--dsw-alias-bg-layer-2, #070b1a);
  --dshn-bg-3: var(--dsw-alias-bg-layer-3, #1b2653);
  --dshn-bg-base: var(--dsw-alias-bg-base, #0b1124);
  --dshn-bg-hover: var(--dsw-alias-interactive-bg-hover, rgba(126, 152, 255, 0.12));
  --dshn-text-1: var(--dsw-alias-label-primary, #eef2ff);
  --dshn-text-2: var(--dsw-alias-label-secondary, #93a1c8);
  --dshn-text-3: var(--dsw-alias-label-tertiary, #64749f);
  --dshn-text-dim: var(--dsw-alias-label-caption, #5b6a99);
  --dshn-border: var(--dsw-alias-border-l2, rgba(126, 152, 255, 0.3));
  --dshn-border-strong: var(--dsw-alias-border-l3, rgba(126, 152, 255, 0.5));
  --dshn-primary: var(--dsw-alias-button-primary-fill, #4a68f5);
  --dshn-primary-hover: var(--dsw-alias-button-primary-hover, #3a55e0);
  --dshn-primary-contrast: var(--dsw-alias-label-primary-inverted, #fff);
  --dshn-accent: var(--dsw-alias-button-contrast-fill, #8ea6ff);
  --dshn-danger: var(--dsw-alias-state-error-primary, #ef4444);
  --dshn-success: var(--dsw-alias-state-success-primary, #22c55e);
  --dshn-warn: var(--dsw-alias-state-warn-primary, #f59e0b);
  --dshn-tooltip-bg: var(--dsw-alias-tooltip-bg, #131c36);
  --dshn-code-bg: var(--dsw-alias-markdown-code-block, rgba(19, 28, 54, 0.5));
  --dshn-scroll-thumb: var(--dsw-alias-scrollbar-bg-l2, rgba(126, 152, 255, 0.25));
  --dshn-scroll-thumb-hover: var(--dsw-alias-scrollbar-hover-l2, rgba(126, 152, 255, 0.4));
  --dshn-shadow: var(--dsw-shadow-lv3, 0 8px 24px rgba(2, 6, 23, 0.45));
  --dshn-shadow-lite: var(--dsw-shadow-lv1, 0 2px 6px rgba(2, 6, 23, 0.35));

  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 2147483000;
}

/* ---- floating dock button (right edge, vertically centered, draggable) ---- */
.dshn-dock {
  --dshn-dock-size: 80px;
  --dshn-dock-scale: 1;
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: var(--dshn-dock-size);
  height: var(--dshn-dock-size);
  border-radius: calc(var(--dshn-dock-size) * 0.3);
  border: 1px solid var(--dshn-border-strong);
  background: linear-gradient(165deg, var(--dshn-bg-1), var(--dshn-bg-2));
  box-shadow:
    var(--dshn-shadow-lite),
    inset 0 1px 0 color-mix(in srgb, var(--dshn-primary-contrast) 10%, transparent);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  padding: 0;
  font: inherit;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

/* Size presets (large = the original 80 px button). */
.dshn-dock[data-size="small"] {
  --dshn-dock-size: 48px;
  --dshn-dock-scale: 0.6;
}

.dshn-dock[data-size="regular"] {
  --dshn-dock-size: 64px;
  --dshn-dock-scale: 0.8;
}

.dshn-dock[data-size="large"] {
  --dshn-dock-size: 80px;
  --dshn-dock-scale: 1;
}

/* The notebook icon scales with the button (46/80 of the container). */
.dshn-dock svg {
  width: calc(var(--dshn-dock-size) * 0.575);
  height: calc(var(--dshn-dock-size) * 0.575);
}

/* Dragged (inline left/top): no translate centering, no right-edge pin. */
.dshn-dock-absolute {
  right: auto;
  transform: none;
}

/* Pinned mode: fixed to the conversation window's top-right corner, not
   draggable (no drag handlers are attached in this mode). */
.dshn-dock-fixed {
  right: auto;
  top: auto;
  transform: none;
  cursor: pointer;
}

.dshn-dock:hover {
  border-color: color-mix(in srgb, var(--dshn-primary) 70%, transparent);
  box-shadow:
    var(--dshn-shadow),
    inset 0 1px 0 color-mix(in srgb, var(--dshn-primary-contrast) 12%, transparent),
    0 0 14px color-mix(in srgb, var(--dshn-primary) 30%, transparent);
}

.dshn-dock:active {
  cursor: grabbing;
}

.dshn-dock-dragging {
  cursor: grabbing;
}

.dshn-dock:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

/* Inner icon carrier: idle float + hover lift + press squish + shine sweep. */
.dshn-dock-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  transition: transform 140ms ease, filter 140ms ease;
  pointer-events: none;
}

/* SVG animation groups: per-element transform origins for the notebook
   choreography (float / cover breathe / line draw / bookmark flutter /
   pen travel / sparkle pop). Driven by the rAF keyframe engine in
   NotebookIcon — CSS here only fixes the transform geometry. */
.dshn-ani-cover {
  transform-box: fill-box;
  transform-origin: center;
}

.dshn-ani-line {
  transform-box: fill-box;
  transform-origin: left center;
}

.dshn-ani-bookmark {
  transform-box: fill-box;
  transform-origin: 50% 0;
}

.dshn-ani-pen {
  transform-box: fill-box;
  transform-origin: left center;
}

.dshn-ani-sparkle {
  transform-box: fill-box;
  transform-origin: center;
}

.dshn-dock:hover .dshn-dock-inner {
  transform: scale(1.06);
  filter: brightness(1.1);
}

.dshn-dock:active .dshn-dock-inner {
  animation: none;
  transform: scale(0.92);
}

.dshn-dock-dragging .dshn-dock-inner {
  animation: none;
  transform: scale(1);
}

.dshn-dock-inner::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, transparent 32%, color-mix(in srgb, var(--dshn-primary-contrast) 18%, transparent) 50%, transparent 68%);
  transform: translateX(-120%);
  pointer-events: none;
}

.dshn-dock:hover .dshn-dock-inner::after {
  animation: dshn-dock-shine 0.9s ease;
}

@keyframes dshn-dock-shine {
  to {
    transform: translateX(120%);
  }
}

.dshn-dock-badge {
  position: absolute;
  top: calc(-5px * var(--dshn-dock-scale));
  right: calc(-6px * var(--dshn-dock-scale));
  min-width: calc(17px * var(--dshn-dock-scale));
  height: calc(17px * var(--dshn-dock-scale));
  padding: 0 calc(4px * var(--dshn-dock-scale));
  border: 1px solid color-mix(in srgb, var(--dshn-primary) 60%, transparent);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: calc(10px * var(--dshn-dock-scale));
  font-weight: 600;
  line-height: 1;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow-lite);
  pointer-events: none;
}

.dshn-dock-tooltip {
  position: absolute;
  right: calc(100% + calc(10px * var(--dshn-dock-scale)));
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-tooltip-bg);
  border: 1px solid var(--dshn-border);
  box-shadow: var(--dshn-shadow-lite);
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease;
}

.dshn-dock:hover .dshn-dock-tooltip {
  opacity: 1;
}

/* ---- panel ---- */
.dshn-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(400px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  background: linear-gradient(170deg, var(--dshn-bg-1), var(--dshn-bg-2));
  border-left: 1px solid var(--dshn-border);
  box-shadow:
    -12px 0 36px var(--dshn-shadow),
    -2px 0 0 color-mix(in srgb, var(--dshn-primary) 12%, transparent);
  backdrop-filter: blur(14px);
  color: var(--dshn-text-1);
  font-size: 13px;
  animation: dshn-panel-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 2147483100;
}

@keyframes dshn-panel-in {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.dshn-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--dshn-border);
}

.dshn-panel-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--dshn-text-1);
  flex: 1;
  min-width: 0;
}

.dshn-panel-count {
  font-size: 11px;
  color: var(--dshn-text-2);
  background: color-mix(in srgb, var(--dshn-primary) 12%, transparent);
  border: 1px solid var(--dshn-border);
  border-radius: 999px;
  padding: 1px 8px;
  white-space: nowrap;
}

.dshn-icon-btn {
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dshn-text-2);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-icon-btn:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-icon-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

.dshn-toolbar {
  display: flex;
  gap: 8px;
  padding: 10px 16px 8px;
}

.dshn-search {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: var(--dshn-bg-base);
  color: var(--dshn-text-1);
  font-size: 12px;
  padding: 6px 10px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-search::placeholder {
  color: var(--dshn-text-dim);
}

.dshn-search:focus {
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 35%, transparent);
}

.dshn-new-btn {
  border: none;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow-lite);
  white-space: nowrap;
  transition: filter 120ms ease, transform 120ms ease, box-shadow 120ms ease;
}

.dshn-new-btn:hover {
  background: var(--dshn-primary-hover);
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.dshn-new-btn:active {
  filter: brightness(0.94);
  transform: translateY(0);
}

.dshn-new-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

/* ---- scope tabs (all / this session / global) ---- */
.dshn-scopes {
  display: flex;
  gap: 4px;
  padding: 0 16px 8px;
}

.dshn-scope {
  flex: 1;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: transparent;
  color: var(--dshn-text-2);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-scope:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-scope-active {
  background: color-mix(in srgb, var(--dshn-primary) 14%, transparent);
  border-color: var(--dshn-primary);
  color: var(--dshn-text-1);
}

.dshn-scope:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

.dshn-scopes-muted {
  color: var(--dshn-text-dim);
  font-size: 11px;
  padding-bottom: 10px;
}

/* ---- session-scope tag on list items ---- */
.dshn-scope-tag {
  color: var(--dshn-accent);
}

.dshn-scope-tag-global {
  color: var(--dshn-text-3);
  background: color-mix(in srgb, var(--dshn-text-3) 14%, transparent);
}

/* ---- editor "save to global" checkbox ---- */
.dshn-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--dshn-text-2);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.dshn-check {
  width: 14px;
  height: 14px;
  accent-color: var(--dshn-primary);
  cursor: pointer;
}

/* ---- note list ---- */
.dshn-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dshn-list::-webkit-scrollbar {
  width: 8px;
}

.dshn-list::-webkit-scrollbar-thumb {
  background: var(--dshn-scroll-thumb);
  border-radius: 999px;
}

.dshn-list::-webkit-scrollbar-thumb:hover {
  background: var(--dshn-scroll-thumb-hover);
}

.dshn-item {
  border: 1px solid var(--dshn-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dshn-bg-base) 55%, transparent);
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
  position: relative;
}

.dshn-item:hover {
  border-color: var(--dshn-border-strong);
  background: var(--dshn-bg-hover);
}

.dshn-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dshn-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
  padding-right: 56px;
}

.dshn-item-preview {
  font-size: 12px;
  color: var(--dshn-text-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.dshn-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--dshn-text-3);
}

.dshn-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.dshn-tag {
  font-size: 10px;
  color: var(--dshn-accent);
  background: color-mix(in srgb, var(--dshn-primary) 14%, transparent);
  border: 1px solid var(--dshn-border);
  border-radius: 999px;
  padding: 1px 7px;
  white-space: nowrap;
}

.dshn-source-tag {
  border-style: dashed;
  opacity: 0.9;
}

/* hover actions */
.dshn-item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
  gap: 4px;
}

.dshn-item:hover .dshn-item-actions,
.dshn-item:focus-within .dshn-item-actions {
  display: inline-flex;
}

.dshn-action {
  border: 1px solid var(--dshn-border-strong);
  border-radius: 7px;
  background: var(--dshn-bg-2);
  color: var(--dshn-text-2);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-action:hover {
  background: color-mix(in srgb, var(--dshn-primary) 35%, transparent);
  color: var(--dshn-primary-contrast);
  border-color: var(--dshn-primary);
}

.dshn-action-danger:hover {
  background: color-mix(in srgb, var(--dshn-danger) 30%, transparent);
  border-color: color-mix(in srgb, var(--dshn-danger) 70%, transparent);
  color: var(--dshn-danger);
}

.dshn-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

/* ---- editor ---- */
.dshn-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  overflow-y: auto;
}

.dshn-editor-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dshn-editor-back {
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dshn-text-2);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.dshn-editor-back:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-editor-title-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--dshn-text-1);
  flex: 1;
  min-width: 0;
}

.dshn-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: var(--dshn-bg-base);
  color: var(--dshn-text-1);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-input::placeholder {
  color: var(--dshn-text-dim);
}

.dshn-input:focus {
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 35%, transparent);
}

.dshn-textarea {
  flex: 1;
  min-height: 160px;
  resize: none;
  line-height: 1.6;
  font-family: inherit;
}

/* ---- Markdown preview/edit toggle + preview pane ---- */
.dshn-md-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 2px;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: var(--dshn-bg-2);
  align-self: flex-start;
}

.dshn-md-btn {
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dshn-text-3);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 12px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.dshn-md-btn:hover {
  color: var(--dshn-text-1);
}

.dshn-md-btn-active {
  background: color-mix(in srgb, var(--dshn-primary) 18%, transparent);
  color: var(--dshn-text-1);
}

.dshn-md-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

.dshn-md-preview {
  flex: 1;
  min-height: 160px;
  overflow-y: auto;
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  background: var(--dshn-bg-base);
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dshn-text-1);
  word-break: break-word;
}

.dshn-md-preview::-webkit-scrollbar {
  width: 8px;
}

.dshn-md-preview::-webkit-scrollbar-thumb {
  background: var(--dshn-scroll-thumb);
  border-radius: 999px;
}

.dshn-md-body > :first-child {
  margin-top: 0;
}

.dshn-md-body > :last-child {
  margin-bottom: 0;
}

.dshn-md-body h1,
.dshn-md-body h2,
.dshn-md-body h3,
.dshn-md-body h4,
.dshn-md-body h5,
.dshn-md-body h6 {
  color: var(--dshn-text-1);
  font-weight: 700;
  line-height: 1.35;
  margin: 0.9em 0 0.4em;
}

.dshn-md-body h1 { font-size: 1.45em; }
.dshn-md-body h2 { font-size: 1.3em; }
.dshn-md-body h3 { font-size: 1.15em; }
.dshn-md-body h4 { font-size: 1.05em; }
.dshn-md-body h5, .dshn-md-body h6 { font-size: 0.95em; }

.dshn-md-body p {
  margin: 0.5em 0;
}

.dshn-md-body a {
  color: var(--dshn-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dshn-md-body strong {
  color: var(--dshn-text-1);
  font-weight: 700;
}

.dshn-md-body ul,
.dshn-md-body ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.dshn-md-body li {
  margin: 0.2em 0;
}

.dshn-md-body li > input[type='checkbox'] {
  accent-color: var(--dshn-primary);
  margin-right: 6px;
  vertical-align: -2px;
}

.dshn-md-body code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  background: var(--dshn-code-bg);
  border: 1px solid var(--dshn-border);
  border-radius: 4px;
  padding: 0.1em 0.35em;
}

.dshn-md-body pre {
  background: var(--dshn-code-bg);
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  margin: 0.6em 0;
}

.dshn-md-body pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.88em;
  line-height: 1.55;
}

.dshn-md-body blockquote {
  margin: 0.6em 0;
  padding: 2px 12px;
  border-left: 3px solid var(--dshn-primary);
  background: color-mix(in srgb, var(--dshn-primary) 8%, transparent);
  color: var(--dshn-text-2);
}

.dshn-md-body table {
  border-collapse: collapse;
  margin: 0.6em 0;
  width: 100%;
  font-size: 0.92em;
}

.dshn-md-body th,
.dshn-md-body td {
  border: 1px solid var(--dshn-border);
  padding: 4px 10px;
  text-align: left;
}

.dshn-md-body th {
  background: color-mix(in srgb, var(--dshn-primary) 10%, transparent);
  color: var(--dshn-text-1);
  font-weight: 600;
}

.dshn-md-body hr {
  border: none;
  border-top: 1px solid var(--dshn-border-strong);
  margin: 0.9em 0;
}

.dshn-md-body img {
  max-width: 100%;
  border-radius: 8px;
}

.dshn-md-body del {
  color: var(--dshn-text-dim);
}

.dshn-md-body :not(pre) > code {
  word-break: break-word;
}

.dshn-editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dshn-btn {
  border: 1px solid var(--dshn-border-strong);
  border-radius: 8px;
  background: transparent;
  color: var(--dshn-text-2);
  font-size: 12px;
  font-weight: 600;
  padding: 7px 16px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dshn-btn:hover {
  background: var(--dshn-bg-hover);
  color: var(--dshn-text-1);
}

.dshn-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dshn-btn-primary {
  border: none;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow-lite);
}

.dshn-btn-primary:hover {
  background: var(--dshn-primary-hover);
  color: var(--dshn-primary-contrast);
}

.dshn-btn-danger {
  color: var(--dshn-danger);
  border-color: color-mix(in srgb, var(--dshn-danger) 40%, transparent);
}

.dshn-btn-danger:hover {
  background: color-mix(in srgb, var(--dshn-danger) 20%, transparent);
  color: var(--dshn-danger);
}

.dshn-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

/* ---- states ---- */
.dshn-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  color: var(--dshn-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.dshn-empty-icon {
  opacity: 0.5;
}

.dshn-loading,
.dshn-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dshn-text-3);
  font-size: 12px;
  padding: 24px;
}

.dshn-error {
  color: var(--dshn-danger);
}

/* ---- toast ---- */
.dshn-toast {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-tooltip-bg);
  border: 1px solid var(--dshn-border-strong);
  box-shadow: var(--dshn-shadow);
  animation: dshn-toast-in 180ms ease-out;
  white-space: nowrap;
  max-width: calc(100% - 32px);
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes dshn-toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* ---- selection save bubble ---- */
.dshn-selection {
  position: fixed;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--dshn-primary) 65%, transparent);
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dshn-primary-contrast);
  background: var(--dshn-primary);
  box-shadow: var(--dshn-shadow), 0 0 0 1px color-mix(in srgb, var(--dshn-primary) 20%, transparent);
  cursor: pointer;
  z-index: 2147483200;
  animation: dshn-selection-in 160ms ease-out;
  transition: filter 120ms ease, transform 120ms ease;
  font-family: inherit;
  line-height: 1.4;
}

.dshn-selection:hover {
  background: var(--dshn-primary-hover);
  filter: brightness(1.1);
}

.dshn-selection:active {
  transform: scale(0.96);
}

.dshn-selection:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 60%, transparent);
}

@keyframes dshn-selection-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ---- settings card (设置 → 插件 → 插件配置) ---- */
.dshn-settings-card {
  border: 1px solid var(--dshn-border);
  background: var(--dshn-bg-3);
  border-radius: 12px;
  list-style: none;
  transition: border-color 160ms ease, background 160ms ease;
}

.dshn-settings-card:hover {
  border-color: var(--dshn-border-strong);
}

.dshn-settings-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px 10px;
}

.dshn-settings-name {
  color: var(--dshn-text-1);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.dshn-settings-description {
  color: var(--dshn-text-3);
  font-size: 13px;
  line-height: 1.5;
}

.dshn-settings-body {
  border-top: 1px solid var(--dshn-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 16px;
  padding: 12px 0 14px;
}

.dshn-settings-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dshn-settings-label {
  color: var(--dshn-text-2);
  font-size: 12px;
  line-height: 1.5;
}

.dshn-settings-label .dshn-check {
  margin-right: 8px;
  vertical-align: -2px;
}

.dshn-settings-control {
  font: inherit;
  color: var(--dshn-text-1);
  background: var(--dshn-bg-base);
  border: 1px solid var(--dshn-border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dshn-settings-control:hover {
  border-color: var(--dshn-border-strong);
}

.dshn-settings-control:focus-visible {
  outline: none;
  border-color: var(--dshn-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dshn-primary) 35%, transparent);
}

.dshn-settings-hint {
  color: var(--dshn-text-dim);
  font-size: 11px;
  line-height: 1.5;
}

.dshn-settings-check-row {
  flex-direction: column;
  gap: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .dshn-panel,
  .dshn-toast,
  .dshn-selection {
    animation: none;
  }

  .dshn-dock,
  .dshn-dock-inner,
  .dshn-action,
  .dshn-btn,
  .dshn-new-btn {
    animation: none;
    transition: none;
  }

  .dshn-dock-inner::after {
    display: none;
  }
}
`;
		//#endregion
		//#region src/client/index.ts
		/** Required services (sessions + conversation power insert-into-composer; the
		* settings scope + slots drive the plugin card in 设置 → 插件 → 插件配置). */
		const inject = [
			"sessions",
			"conversation",
			"slots",
			"settingsScope"
		];
		/**
		* Insert a note into the current session's composer draft; falls back to the
		* clipboard when no session is open or the input facade is unreachable.
		* Only the note CONTENT is inserted — the title is a list label, not chat
		* payload, and would only add noise to the draft.
		* @param ctx - client root context.
		* @param note - the note to insert.
		* @returns a toast copy describing what happened.
		*/
		function insertIntoComposer(ctx, note) {
			const text = note.content;
			const current = ctx.sessions.list.getSnapshot().current;
			if (current !== void 0) {
				const actx = ctx.sessions.scope(current);
				if (actx !== void 0) try {
					const input = ctx.conversation.input.for(actx);
					const draft = input.state.getSnapshot().draft ?? "";
					input.setDraft(draft.trim() === "" ? text : draft + "\n\n" + text);
					return t("notes.item.inserted");
				} catch {}
			}
			const clipboard = navigator.clipboard;
			if (clipboard !== void 0) clipboard.writeText(text).then(() => {}, () => {});
			return t("notes.item.noSession");
		}
		/**
		* Client plugin body: inject the styles, read the host switches, and mount
		* the floating notes dock for the page lifetime.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const styleTag = document.createElement("style");
			styleTag.dataset.plugin = "dsh-web-notes";
			styleTag.dataset.pluginCss = "dsh-web-notes/styles";
			styleTag.textContent = NOTES_CSS;
			document.head.appendChild(styleTag);
			let styleRemoved = false;
			ctx.effect(() => () => {
				if (styleRemoved) return;
				styleRemoved = true;
				styleTag.remove();
			}, "notes: styles");
			const api = createNotesApi();
			const settingsScope = ctx.settingsScope.bind(notesSettingsSpec);
			ctx.effect(() => ctx.slots.inject("settings.plugin.item", function* () {
				yield ctx.slots.register({
					name: "settings.plugin.item",
					key: "notes",
					inject: () => ({
						scope: settingsScope,
						notesT: t
					})
				}, NotesSettingsCard);
			}), "notes: settings card");
			let mounted = false;
			let root;
			let container;
			const mount = (capture) => {
				if (mounted) return;
				mounted = true;
				container = document.createElement("div");
				container.dataset.dshNotesRoot = "";
				container.dataset.dshPlugin = "notes";
				document.body.appendChild(container);
				root = (0, react_dom_client.createRoot)(container);
				root.render((0, react.createElement)(NotesDock, {
					api,
					t,
					sessions: ctx.sessions,
					settingsScope,
					selectionCapture: capture,
					onInsert: (note) => insertIntoComposer(ctx, note)
				}));
			};
			const syncEnabled = () => {
				if (mounted) return;
				api.state().then((state) => {
					if (mounted) return;
					if (!state.enabled) return;
					mount(state.selectionCapture);
				}, () => {
					if (!mounted) mount(true);
				});
			};
			ctx.effect(() => {
				syncEnabled();
				return () => {
					if (root !== void 0) {
						root.unmount();
						root = void 0;
					}
					if (container !== void 0 && container.parentNode === document.body) {
						container.remove();
						container = void 0;
					}
					mounted = false;
				};
			}, "notes: ui");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map