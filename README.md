# dsh-web-notes

Floating notes for the [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) web GUI (dsh web). Keep commands, credentials, parameter values and any other important snippets at hand while working — and feed them back into the conversation with one click.

[中文](README.zh.md)

## Features

- **Floating dock** — an animated notebook icon on the right edge of the chat window, one click away at all times. Drag it anywhere (the position persists); it honours `prefers-reduced-motion`.
- **Configurable placement & size** — in **设置 → 插件 → 插件配置** the dock can be set to **悬浮 (floating, draggable)** or **固定 (pinned to the chat window's top-right corner, not draggable)**, and the button size to **较小 / 常规 / 较大**. Changes apply live — no reload.
- **Notes panel** — slide-over panel with search, a note list (title, preview, tags, relative time), and per-note actions.
- **Insert into the composer** — one click places the note's content into the current session's input box (the title stays a list label), ready to review and send. When no session is open, the content is copied to the clipboard instead.
- **Save any selection** — select text anywhere on the page (e.g. part of an AI answer) and a floating **"Save as note"** button appears; one click captures it, with the first line as the title. The bubble **follows the selection while you scroll** and only disappears when the selection collapses, you click elsewhere on the page, or you switch windows.
- **Markdown preview** — the note editor **auto-detects Markdown** (headings, lists, code fences, quotes, tables, links, bold/italic…). Plain notes stay a plain editor; once MD syntax is present an **编辑 / 预览** toggle appears, and the preview renders full GFM (sanitized with DOMPurify — raw HTML/scripts never execute).
- **Per-session notes** — a note can be bound to the **current session** (visible only while that session is current) or saved as **global** (visible in every session and on the new-conversation screen). The panel has **All / This session / Global** scope tabs; new notes default to the current session, with a "save to global" checkbox in the editor — or default to global for every new note via the **默认保存全局** setting.
- **Persistence** — notes are stored locally on the host under `$DSH_HOME/notes/notes.json` (default `~/.dsh/notes/notes.json`), atomic writes, tolerant reads.
- **Privacy by design** — the notes API is loopback-only, so the data never leaves the local machine.
- **Theme & skin adaptive** — every color rides the official dsh design tokens (`--dsw-alias-*`), so the UI matches the official light/dark theme out of the box AND recolors live when a skin plugin (dsh-skins / skin-center) is installed — no reload, no skin-specific code.
- **zh/en UI** — follows the document language.

## Install

### From npm

The package is published on the npm registry:

```sh
dsh plugin --profile web add dsh-web-notes
```

If your default npm registry is a mirror that has not synced the package yet (e.g. npmmirror — read-only, syncs with a delay), install straight from the official registry instead:

```sh
dsh plugin --profile web add dsh-web-notes --registry https://registry.npmjs.org/
```

### From a local checkout (development)

```sh
dsh plugin --profile web add link:/path/to/dsh-web-notes
```

Then add the bundle to the profile manifest so it actually boots:

```sh
# append "dsh-web-notes" to the bundles list in ~/.dsh/profiles/web/package.json
# under "dsh" > "profile" > "bundles", then restart dsh web
```

> The official `dsh plugin --profile web add <spec>` command forwards to pnpm; it installs the package but does **not** edit the `dsh.profile.bundles` manifest — that list decides which installed packages boot. Add the package name there (or ship a `cordis.patch.yml` insert via an aggregator bundle) and restart.

### Verify the install

```sh
dsh plugin --profile web list          # dsh-web-notes should be installed
npm view dsh-web-notes version         # → 0.7.0
```

After restarting dsh web, the notebook icon appears on the right edge of the chat window (see [Usage](#usage)).

## Usage

1. Click the notebook icon on the right edge of the chat window.
2. Click **New** to write a note (title optional — defaults to the first line), or select any text on the page and click **Save as note**.
3. In the note list:
   - **Insert** — puts the note into the input box of the current session (appended after any existing draft); press Enter to send.
   - **Copy** — copies title + content to the clipboard.
   - **Edit** / **Delete** — manage the note.

Notes are searchable by title, content and tags (comma-separated in the editor).

## Configuration

The plugin registers a `notes` settings namespace and a settings card in **设置 → 插件 → 插件配置** (the namespace is also editable via `~/.dsh/settings.yaml`):

```yaml
notes:
  enabled: true            # master switch: false hides the dock entirely
  selectionCapture: true   # false disables the selection "Save as note" bubble
  dockMode: floating       # floating (draggable) | fixed (chat window top-right)
  buttonSize: large        # small | regular | large
  defaultGlobal: false     # new notes default to global (all sessions)
```

All five options are editable live in the settings card; the dock and panel pick up changes immediately.

## Security

Notes may contain credentials, tokens, or other sensitive values. They are stored **in plaintext** in a local JSON file (`~/.dsh/notes/notes.json`, same trust model as `~/.dsh/credentials.yaml`) and are served only to the loopback browser UI. Do not store secrets you cannot afford to expose on this machine, and protect the file with your OS-level user permissions. Exporting/backing up that file also exports every note.

## Development

```sh
pnpm install
pnpm run build        # tsc -b (types) + tsdown (lib/index.js + lib/client.js)
node scripts/smoke-host.mjs   # standalone host-logic smoke test (no dsh app needed)
```

Architecture:

- **Host half** (`src/index.ts`, `src/service.ts`, `src/routes.ts`, `src/persist.ts`) — cordis plugin row `notes`; CRUD service, atomic JSON persistence, loopback-guarded `/api/notes/*` routes, settings namespace.
- **Browser half** (`src/client/`) — global floating surface mounted on `document.body` (notes have no session dimension); talks to the host through same-origin JSON; inserts into the composer through the official conversation input facade (`ctx.conversation.input.for(actx).setDraft(...)`).

The client bundle is built as a closure-factory artifact (`window.__ModuleLoader__.load({ id: 'dsh-web-notes', factory })`) served by the web plugin table at `/plugins/dsh-web-notes/client.js`.

## Roadmap

- Note categories/pinning.
- Insert with optional send-immediately.

## License

Apache-2.0. © 2025 Shrbuz — see [NOTICE](NOTICE) for attribution.
