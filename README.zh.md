# dsh-web-notes

[DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) Web GUI（dsh web）的悬浮笔记插件。把命令、重要凭证、参数值以及任何你认为值得记录的内容随手记下来，并在需要时一键放回对话里。

[English](README.md)

## 功能

- **悬浮图标** — 聊天窗口右侧的动画笔记本图标，随时可点；可拖拽到任意位置（自动保存），遵循系统「减弱动态效果」设置。
- **入口与大小可配置** — 在 **设置 → 插件 → 插件配置** 中可选择**悬浮（可拖动）**或**固定（钉在对话窗口右上角，不可拖动）**两种快捷入口，按钮大小可选**较小 / 常规 / 较大**。改动即时生效，无需刷新。
- **笔记面板** — 滑出式面板：搜索、笔记列表（标题、预览、标签、相对时间）、每条笔记的操作按钮。
- **关闭面板** — X、ESC、dock 按钮、点击面板外部、以及触屏下的底部「关闭」按钮都能关闭面板；**任何关闭方式都会先保存正在编辑的草稿**而不是丢弃，编辑器里的「取消」是唯一的显式丢弃入口。
- **触屏/粗指针适配** — 触屏设备上所有控件放大到至少 44px 触控目标、每条笔记的操作按钮由「仅悬停显示」改为常驻可点行（触屏没有 hover，原本根本点不到）、拖拽调宽条加宽，并在拇指区提供底部「关闭」按钮；精确指针（鼠标）桌面端保持原有紧凑布局不变。
- **引入对话框** — 一键把笔记内容放入当前会话的输入框（标题保留为列表标签，不混入正文），检查后回车即可发送；没有打开会话时自动退化为复制到剪贴板。
- **选中即存** — 在页面上选中任意文本（比如 AI 回答中的一段），旁边会出现悬浮的「存为笔记」按钮，一键保存，首行自动作为标题。气泡会**随滚动跟随选中内容**，只有当选中取消、点击页面其他位置或切换窗口时才消失。
- **Markdown 预览** — 笔记编辑器**自动识别 Markdown**（标题、列表、代码块、引用、表格、链接、加粗/斜体等）：普通笔记仍是纯文本框；一旦出现 MD 语法即显示「编辑 / 预览」切换按钮，预览按完整 GFM 渲染（DOMPurify 消毒，原始 HTML/脚本不会执行）。
- **会话级笔记** — 笔记可以绑定**当前会话**（仅在该会话打开时可见），也可以存为**全局**（所有会话及新对话页均可见）。面板提供「全部 / 当前会话 / 全局」作用域切换；新建笔记默认归入当前会话，编辑器中可勾选「保存到全局」；打开「默认保存全局」后，每次新建笔记都默认存为全局。
- **本地持久化** — 笔记存储在宿主机本地 `$DSH_HOME/notes/notes.json`（默认 `~/.dsh/notes/notes.json`），原子写入、容错读取。
- **隐私优先** — 笔记 API 仅允许 loopback 访问，数据不出本机。
- **主题/皮肤自适应** — 所有颜色都使用官方 dsh 设计令牌（`--dsw-alias-*`）：默认完美匹配官方浅色/深色主题；安装皮肤插件（dsh-skins / skin-center）后自动跟随皮肤配色实时变化，无需刷新、无需皮肤专用代码。
- **中英文界面** — 跟随页面语言。

## 安装

### 从 npm 安装

插件已发布到 npm registry：

```sh
dsh plugin --profile web add dsh-web-notes
```

如果你的默认 npm 源是镜像且尚未同步到该包（例如 npmmirror——只读、同步有延迟），可直接指定官方源安装：

```sh
dsh plugin --profile web add dsh-web-notes --registry https://registry.npmjs.org/
```

### 本地开发安装

```sh
dsh plugin --profile web add link:/path/to/dsh-web-notes
```

然后把 bundle 加入 profile 清单，插件才会真正启动：

```sh
# 在 ~/.dsh/profiles/web/package.json 的 "dsh" > "profile" > "bundles" 列表末尾
# 追加 "dsh-web-notes"，然后重启 dsh web
```

> 官方 `dsh plugin --profile web add <spec>` 只是转发给 pnpm：它会安装包，但**不会**修改 `dsh.profile.bundles` 清单——由这个清单决定哪些已安装的包会被启动。需要手动把包名加进去（或通过聚合包携带 `cordis.patch.yml` insert），再重启。

### 验证安装

```sh
dsh plugin --profile web list          # 应能看到 dsh-web-notes
npm view dsh-web-notes version         # → 最新已发布版本
```

重启 dsh web 后，聊天窗口右侧会出现笔记本图标（见[使用](#使用)）。

### 更新

`dsh plugin` 只是转发给 pnpm，所以更新就是 pnpm 的 `update`——无需手动改 manifest（profile 会在下一次 `dsh plugin` 运行时按已安装状态自动对账 bundle 清单），然后重启 dsh web：

```sh
dsh plugin --profile web update dsh-web-notes
# 或指定精确版本：
dsh plugin --profile web add dsh-web-notes@latest --registry https://registry.npmjs.org/
```

> **镜像同步延迟**：发布是发到官方源的，而 npmmirror 等镜像同步有延迟——刚发布后你的默认源可能还是旧版本（甚至短暂 404）。如果新版本发布后 update「没反应」，加上 `--registry https://registry.npmjs.org/` 直连官方源即可。

> 更新不会动你的笔记：数据存在宿主机 `$DSH_HOME/notes/notes.json`，设置也会保留。

## 使用

1. 点击聊天窗口右侧的笔记本图标。
2. 点击「新建」记录内容（标题可选，默认取内容首行）；或在页面上选中任意文本，点击悬浮的「存为笔记」。
3. 笔记列表中：
   - **引入** — 把笔记放进当前会话的输入框（若已有内容则追加在后面），回车即可发送。
   - **复制** — 把标题 + 内容复制到剪贴板。
   - **编辑** / **删除** — 管理笔记。

笔记支持按标题、内容、标签搜索（编辑时用逗号分隔标签）。

## 配置

插件注册了 `notes` 设置命名空间，并在 **设置 → 插件 → 插件配置** 中提供设置卡片（命名空间也可通过 `~/.dsh/settings.yaml` 修改）：

```yaml
notes:
  enabled: true            # 总开关：false 时完全隐藏悬浮图标
  selectionCapture: true   # false 时关闭「选中即存」悬浮按钮
  dockMode: floating       # floating（悬浮可拖动）| fixed（对话窗口右上角固定）
  buttonSize: large        # small（较小）| regular（常规）| large（较大）
  defaultGlobal: false     # 新建笔记默认存为全局（所有会话可见）
```

五项均可直接在设置卡片中实时修改，悬浮图标与面板立即响应。

## 安全说明

笔记里可能包含凭证、Token 等敏感信息。它们以**明文**存储在本地 JSON 文件（`~/.dsh/notes/notes.json`，与 `~/.dsh/credentials.yaml` 同一信任模型），且仅向本机浏览器提供服务。请勿存放你无法承受在本机泄露的密钥，并依靠操作系统的用户权限保护该文件。备份/导出该文件即等于导出全部笔记。

## 开发

```sh
pnpm install
pnpm run build        # tsc -b（类型）+ tsdown（lib/index.js + lib/client.js）
node scripts/smoke-host.mjs   # 宿主逻辑独立冒烟测试（无需 dsh 应用）

# 客户端 UI 验证，无需 dsh 应用（见下）
pnpm exec tsdown --config tsdown.harness.config.ts
node scripts/verify-touch.mjs
```

`scripts/verify-touch.mjs` 驱动 `scripts/harness/entry.tsx`：一个独立 harness，用**真实的 `NotesDock` 组件树 + 真实的 `NOTES_CSS`** 配上 mock 的宿主契约（笔记 API、会话 store、settings scope），在无头 Chrome 中经 CDP 断言粗指针适配与各条关闭路径，并输出 `.logs/touch-desktop.png` / `.logs/touch-coarse.png` 供肉眼检查。

> `scripts/cdp-*.mjs` 与 `screenshot.mjs` 这些探针驱动的是**正在运行的 GUI**，因此需要该实例的浏览器认证：dsh ≥ 0.1.5 把 `/` 放在进程级 launch token（换取签名 cookie）之后，全新的无头浏览器会拿到 `401 dsh web authentication required`，应用根本不会启动。请在同一个浏览器 profile 中打开 `dsh web` 启动时打印的带 token URL，或改用上面的 harness 做纯客户端检查。

架构：

- **宿主侧**（`src/index.ts`、`src/service.ts`、`src/routes.ts`、`src/persist.ts`）— cordis 插件行 `notes`：CRUD 服务、原子 JSON 持久化、loopback 保护的 `/api/notes/*` 路由、settings 命名空间。
- **浏览器侧**（`src/client/`）— 直接挂在 `document.body` 上的全局悬浮界面（笔记没有会话维度）；通过同源 JSON 与宿主通信；通过官方对话输入门面 `ctx.conversation.input.for(actx).setDraft(...)` 写入输入框。

客户端 bundle 以闭包工厂产物（`window.__ModuleLoader__.load({ id: 'dsh-web-notes', factory })`）构建，由 web 插件表在 `/plugins/dsh-web-notes/client.js` 提供。

## Roadmap

- 笔记分类 / 置顶。
- 引入时可选「直接发送」。

## License

Apache-2.0。© 2026 Shrbuz — 署名信息见 [NOTICE](NOTICE)。
