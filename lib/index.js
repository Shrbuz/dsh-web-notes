import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "schemastery";
import { randomUUID } from "node:crypto";
import { Service } from "@deepseek-ai/cordis";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { homedir } from "node:os";
//#region src/dsh-home.ts
/**
* DSH_HOME resolution shared by plugin host halves: the environment override
* wins, the platform home fallback follows (same semantics as the official
* dsh-home-paths package and the dsh-web-ui plugin family).
* @module dsh-web-notes/dsh-home
*/
/** Expand a leading ~ (or ~user) in a path, platform-style. */
function expandHome(path, home = homedir()) {
	if (path === "~") return home;
	if (path.startsWith("~/") || path.startsWith("~\\")) return join(home, path.slice(2));
	return path;
}
/**
* Resolve the DSH home directory.
* @param env - process environment to read DSH_HOME from.
* @param home - platform home directory fallback (test seam).
* @returns the absolute DSH home path.
*/
function resolveDshHome(env = process.env, home = homedir()) {
	const raw = env.DSH_HOME;
	if (raw !== void 0 && raw.trim() !== "") {
		const expanded = expandHome(raw.trim(), home);
		return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded);
	}
	return join(home, ".dsh");
}
/** Resolve the DSH home directory from the live environment. */
function dshHome() {
	return resolveDshHome();
}
//#endregion
//#region src/persist.ts
/**
* Notes persistence — one JSON store under $DSH_HOME/notes/notes.json with
* atomic rename writes and tolerant reads (corrupt or missing file → empty
* store). Notes may carry credentials and other sensitive values; they are
* stored PLAINTEXT on the local disk on purpose (like ~/.dsh/credentials
* files) — see the README security section.
* @module dsh-web-notes/persist
*/
/** Title length cap (chars). */
const NOTE_TITLE_MAX = 200;
/** Content length cap (chars). */
const NOTE_CONTENT_MAX = 2e5;
/** Tags per note. */
const NOTE_TAGS_MAX = 20;
/** Total notes cap — protects the store from runaway growth. */
const NOTES_MAX = 5e3;
/** Default title when the caller supplies none. */
const DEFAULT_NOTE_TITLE = "未命名笔记";
/** Persistence directory: $DSH_HOME/notes (or ~/.dsh/notes). */
function notesHomeDir() {
	return join(dshHome(), "notes");
}
function emptyPersist() {
	return { notes: [] };
}
/** Numeric field guard: finite numbers only, else the fallback. */
function finiteNum(value, fallback) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
/** String field guard with an optional length cap. */
function str(value, fallback, max) {
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim();
	if (trimmed === "") return fallback;
	return max === void 0 ? trimmed : trimmed.slice(0, max);
}
/** Sanitize the tags array (lowercased, trimmed, deduped, capped). */
function sanitizeTags(value) {
	if (!Array.isArray(value)) return [];
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const raw of value) {
		if (typeof raw !== "string") continue;
		const tag = raw.trim().toLowerCase().slice(0, 32);
		if (tag === "" || seen.has(tag)) continue;
		seen.add(tag);
		out.push(tag);
		if (out.length >= 20) break;
	}
	return out;
}
/** Load the persisted document; missing/corrupt files fall back to empty. */
function loadNotesPersist(dir = notesHomeDir()) {
	try {
		const raw = readFileSync(join(dir, "notes.json"), "utf8");
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed.notes)) return emptyPersist();
		const notes = [];
		for (const item of parsed.notes.slice(0, NOTES_MAX)) {
			if (typeof item !== "object" || item === null) continue;
			const record = item;
			const id = str(record.id, "", 64);
			if (id === "") continue;
			const title = str(record.title, DEFAULT_NOTE_TITLE, 200);
			const content = typeof record.content === "string" ? record.content.slice(0, NOTE_CONTENT_MAX) : "";
			if (title === "未命名笔记" && content === "") continue;
			const sourceRaw = record.source;
			const source = sourceRaw === "selection" || sourceRaw === "composer" || sourceRaw === "manual" ? sourceRaw : "manual";
			const sessionRaw = record.sessionId;
			const sessionId = typeof sessionRaw === "string" && sessionRaw.trim() !== "" ? sessionRaw.trim().slice(0, 64) : void 0;
			notes.push({
				id,
				title,
				content,
				tags: sanitizeTags(record.tags),
				source,
				...sessionId === void 0 ? {} : { sessionId },
				createdAt: finiteNum(record.createdAt, 0),
				updatedAt: finiteNum(record.updatedAt, 0)
			});
		}
		notes.sort((a, b) => b.updatedAt - a.updatedAt);
		return { notes };
	} catch {
		return emptyPersist();
	}
}
/** Atomically persist the document (write temp + rename). */
function saveNotesPersist(data, dir = notesHomeDir()) {
	mkdirSync(dir, { recursive: true });
	const target = join(dir, "notes.json");
	const tmp = `${target}.tmp`;
	writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
	renameSync(tmp, target);
}
//#endregion
//#region src/service.ts
/**
* Notes host service — the CRUD domain behind the browser UI. Owns the
* in-memory note list (loaded once from disk) and persists every mutation
* through the atomic JSON store. All browser access goes through the
* loopback-guarded /api/notes/* routes; this service is also the seam a test
* or an embedding application can drive directly.
* @module dsh-web-notes/service
*/
/** Settings namespace of the notes capability. */
const NOTES_SETTINGS_NAMESPACE = "notes";
function ok(value) {
	return {
		ok: true,
		value
	};
}
function fail(error) {
	return {
		ok: false,
		error
	};
}
/**
* The notes service (`notes`): scope-free host singleton. The browser half
* never imports this — it talks to the loopback API routes, keeping the
* client bundle free of host packages.
*/
var NotesService = class extends Service {
	notes;
	dir;
	enabled;
	selectionCapture;
	dockMode;
	buttonSize;
	defaultGlobal;
	constructor(ctx, config = {}) {
		super(ctx, "notes");
		this.dir = config.persistDir ?? notesHomeDir();
		this.notes = loadNotesPersist(this.dir).notes;
		this.enabled = config.enabled ?? true;
		this.selectionCapture = config.selectionCapture ?? true;
		this.dockMode = config.dockMode ?? "floating";
		this.buttonSize = config.buttonSize ?? "large";
		this.defaultGlobal = config.defaultGlobal ?? false;
	}
	/** The settings section mirror (base + live values). */
	settingsSection() {
		return {
			enabled: this.enabled,
			selectionCapture: this.selectionCapture,
			dockMode: this.dockMode,
			buttonSize: this.buttonSize,
			defaultGlobal: this.defaultGlobal
		};
	}
	applySettingsSection(section) {
		this.enabled = section.enabled;
		this.selectionCapture = section.selectionCapture;
		this.dockMode = section.dockMode;
		this.buttonSize = section.buttonSize;
		this.defaultGlobal = section.defaultGlobal;
	}
	/** Whether the plugin (and its routes) is enabled. */
	isEnabled() {
		return this.enabled;
	}
	setEnabled(enabled) {
		this.enabled = enabled;
	}
	/** Whether the selection-capture bubble is enabled. */
	isSelectionCaptureEnabled() {
		return this.selectionCapture;
	}
	/** Dock placement mode. */
	dockPlacement() {
		return this.dockMode;
	}
	/** Dock button size preset. */
	dockSize() {
		return this.buttonSize;
	}
	/** Whether new notes default to global. */
	isDefaultGlobal() {
		return this.defaultGlobal;
	}
	/**
	* List notes for the given context, newest-updated first.
	* - scope 'session': notes bound to the current session
	* - scope 'global': notes bound to no session
	* - scope 'all' (default): session-bound notes + global notes; without a
	*   session context (new-conversation screen) this collapses to global only,
	*   so a session's notes never leak onto another screen.
	*/
	list(query, opts = {}) {
		const q = query?.trim().toLowerCase();
		const scope = opts.scope ?? "all";
		const sessionId = typeof opts.sessionId === "string" && opts.sessionId !== "" ? opts.sessionId : void 0;
		const inScope = (note) => {
			if (scope === "session") return sessionId !== void 0 && note.sessionId === sessionId;
			if (scope === "global") return note.sessionId === void 0;
			return sessionId === void 0 ? note.sessionId === void 0 : note.sessionId === sessionId || note.sessionId === void 0;
		};
		return this.notes.filter((note) => {
			if (!inScope(note)) return false;
			if (q === void 0 || q === "") return true;
			return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q) || note.tags.some((tag) => tag.includes(q));
		}).map(toView);
	}
	/** Count of notes in the given context (same semantics as list). */
	count(opts = {}) {
		return this.list(void 0, opts).length;
	}
	/** One note by id. */
	get(id) {
		const note = this.notes.find((candidate) => candidate.id === id);
		return note === void 0 ? void 0 : toView(note);
	}
	/** Create a note. */
	create(input) {
		const content = typeof input.content === "string" ? input.content.trim() : "";
		if (content === "") return fail("note-content-empty");
		if (content.length > 2e5) return fail("note-content-too-long");
		if (this.notes.length >= 5e3) return fail("notes-limit-reached");
		const now = Date.now();
		const title = typeof input.title === "string" && input.title.trim() !== "" ? input.title.trim().slice(0, 200) : titleFromContent(content);
		const source = input.source === "selection" || input.source === "composer" ? input.source : "manual";
		const sessionId = sanitizeSessionId(input.sessionId);
		const note = {
			id: randomUUID(),
			title,
			content,
			tags: sanitizeTags(input.tags),
			source,
			...sessionId === void 0 ? {} : { sessionId },
			createdAt: now,
			updatedAt: now
		};
		this.notes.unshift(note);
		this.persist();
		return ok(toView(note));
	}
	/** Update title/content/tags/session of one note (updatedAt advances). */
	update(id, patch) {
		const note = this.notes.find((candidate) => candidate.id === id);
		if (note === void 0) return fail("note-not-found");
		if (patch.title !== void 0) {
			const title = patch.title.trim();
			note.title = title === "" ? DEFAULT_NOTE_TITLE : title.slice(0, 200);
		}
		if (patch.content !== void 0) {
			const content = patch.content.trim();
			if (content === "") return fail("note-content-empty");
			if (content.length > 2e5) return fail("note-content-too-long");
			note.content = content;
		}
		if (patch.tags !== void 0) note.tags = sanitizeTags(patch.tags);
		if (patch.sessionId !== void 0) {
			const sessionId = sanitizeSessionId(patch.sessionId);
			if (sessionId === void 0) delete note.sessionId;
			else note.sessionId = sessionId;
		}
		note.updatedAt = Date.now();
		this.persist();
		return ok(toView(note));
	}
	/** Delete one note. */
	remove(id) {
		const before = this.notes.length;
		this.notes = this.notes.filter((note) => note.id !== id);
		if (!(this.notes.length < before)) return fail("note-not-found");
		this.persist();
		return ok({ removed: true });
	}
	/** Delete every note. */
	clear() {
		const cleared = this.notes.length;
		this.notes = [];
		this.persist();
		return ok({ cleared });
	}
	persist() {
		saveNotesPersist({ notes: this.notes }, this.dir);
	}
};
/** First non-empty line of the content, truncated — a title from the body. */
function titleFromContent(content) {
	const text = (content.split("\n").find((part) => part.trim() !== "") ?? "未命名笔记").trim();
	return text.length > 48 ? text.slice(0, 48) + "…" : text;
}
/** Normalize a session binding: valid non-empty string → capped id; anything else → global. */
function sanitizeSessionId(value) {
	if (typeof value !== "string") return void 0;
	const trimmed = value.trim();
	return trimmed === "" ? void 0 : trimmed.slice(0, 64);
}
function toView(note) {
	return {
		id: note.id,
		title: note.title,
		content: note.content,
		tags: [...note.tags],
		source: note.source,
		...note.sessionId === void 0 ? {} : { sessionId: note.sessionId },
		createdAt: note.createdAt,
		updatedAt: note.updatedAt
	};
}
//#endregion
//#region src/loopback.ts
/** IPv4 127/8 predicate (four decimal octets, first == 127). */
function isIPv4Loopback(v4) {
	const parts = v4.split(".");
	return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
/** Whether a socket remote address names the loopback range (127/8, ::1, IPv4-mapped). */
function isLoopbackAddress(address) {
	if (address === void 0) return false;
	const normalized = address.toLowerCase();
	if (normalized === "::1") return true;
	if (normalized.startsWith("::ffff:")) return isIPv4Loopback(normalized.slice(7));
	return isIPv4Loopback(normalized);
}
/** Whether a normalized URL hostname names the loopback authority (localhost, [::1], 127/8). */
function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]") return true;
	return isIPv4Loopback(hostname);
}
/**
* Request-level trust fence: a loopback socket address AND a loopback Host
* header, plus browser same-origin markers.
*/
function isLoopbackRequest(request) {
	if (!isLoopbackAddress(request.socket.remoteAddress)) return false;
	const host = request.headers.host;
	if (typeof host !== "string") return false;
	let hostUrl;
	try {
		hostUrl = new URL("http://" + host);
	} catch {
		return false;
	}
	if (!isLoopbackHostname(hostUrl.hostname)) return false;
	if (request.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = request.headers.origin;
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
//#endregion
//#region src/routes.ts
/** Browser-facing base path of the notes API. */
const NOTES_API_PREFIX = "/api/notes";
/** Write one JSON response. */
function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
/** Require the method or answer 405. */
function requireMethod(req, res, method) {
	if (req.method === method) return true;
	json(res, 405, {
		ok: false,
		error: "method-not-allowed"
	});
	return false;
}
/** Read a JSON request body (bounded). */
function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > 524288) {
				reject(/* @__PURE__ */ new Error("body-too-large"));
				queueMicrotask(() => req.destroy());
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (chunks.length === 0) {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch {
				reject(/* @__PURE__ */ new Error("invalid-json"));
			}
		});
		req.on("error", reject);
	});
}
/** Shared route fence: the browser UI is a loopback client; LAN hosts stay out. */
function guard(req, res) {
	if (isLoopbackRequest(req)) return true;
	json(res, 403, {
		ok: false,
		error: "forbidden: loopback-only"
	});
	return false;
}
/** Wrap one async service call as a GET JSON route. */
function getRoute(path, run) {
	return {
		kind: "exact",
		path,
		handler: (req, res) => {
			if (!guard(req, res)) return;
			if (!requireMethod(req, res, "GET")) return;
			let query;
			try {
				query = new URL(req.url ?? "/", "http://notes.local").searchParams;
			} catch {
				json(res, 400, {
					ok: false,
					error: "invalid-url"
				});
				return;
			}
			run(query).then((value) => json(res, 200, value), (error) => {
				json(res, 500, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
		}
	};
}
/** Wrap one async service call as a POST JSON route (body passed through). */
function postRoute(path, run) {
	return {
		kind: "exact",
		path,
		handler: (req, res) => {
			if (!guard(req, res)) return Promise.resolve();
			if (!requireMethod(req, res, "POST")) return Promise.resolve();
			return readJsonBody(req).then((body) => {
				return run(typeof body === "object" && body !== null ? body : {}).then((value) => json(res, 200, value), (error) => {
					json(res, 400, {
						ok: false,
						error: error instanceof Error ? error.message : String(error)
					});
				});
			}, (error) => {
				json(res, 400, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
		}
	};
}
/** Build the route family for one service. */
function makeNotesRoutes(service) {
	return [
		getRoute("/api/notes/state", async () => ({
			enabled: service.isEnabled(),
			selectionCapture: service.isSelectionCaptureEnabled(),
			dockMode: service.dockPlacement(),
			buttonSize: service.dockSize(),
			defaultGlobal: service.isDefaultGlobal()
		})),
		getRoute("/api/notes/list", async (query) => {
			const sessionRaw = query.get("session");
			const scopeRaw = query.get("scope");
			const opts = {
				sessionId: sessionRaw === null || sessionRaw === "" ? null : sessionRaw,
				scope: scopeRaw === "session" || scopeRaw === "global" ? scopeRaw : "all"
			};
			return {
				notes: service.list(query.get("q") ?? void 0, opts),
				count: service.count(opts)
			};
		}),
		postRoute("/api/notes/create", async (body) => {
			const title = body.title;
			const content = body.content;
			const tags = body.tags;
			const source = body.source;
			return service.create({
				...typeof title === "string" ? { title } : {},
				content: typeof content === "string" ? content : "",
				...Array.isArray(tags) ? { tags: tags.filter((tag) => typeof tag === "string") } : {},
				...source === "selection" || source === "composer" ? { source } : {},
				...typeof body.sessionId === "string" || body.sessionId === null ? { sessionId: body.sessionId } : {}
			});
		}),
		postRoute("/api/notes/update", async (body) => {
			const id = body.id;
			if (typeof id !== "string" || id === "") throw new Error("invalid-id");
			return service.update(id, {
				...typeof body.title === "string" ? { title: body.title } : {},
				...typeof body.content === "string" ? { content: body.content } : {},
				...Array.isArray(body.tags) ? { tags: body.tags.filter((tag) => typeof tag === "string") } : {},
				...typeof body.sessionId === "string" || body.sessionId === null ? { sessionId: body.sessionId } : {}
			});
		}),
		postRoute("/api/notes/delete", async (body) => {
			const id = body.id;
			if (typeof id !== "string" || id === "") throw new Error("invalid-id");
			return service.remove(id);
		}),
		postRoute("/api/notes/clear", async () => service.clear())
	];
}
//#endregion
//#region src/mount-once.ts
/**
* Host single-instance guard. A profile may end up with the same plugin
* reachable from two sources (an npm install and a `link:` install side by
* side); without this guard the second instance would re-register the same
* webserver routes and settings namespaces and fail the boot. mountOnce makes
* the second host apply a no-op for the lifetime of the first instance.
*
* The registry rides a global symbol so two module instances of the same
* package still share one verdict. `ctx.effect` runs its callback immediately
* and treats the callback's return value as the fiber disposer, so the
* unmarker is returned, not run.
* @module dsh-web-notes/mount-once
*/
const MOUNTED = Symbol.for("dsh-web-notes.mounted-plugins");
function mountedSet() {
	const registry = globalThis;
	return registry[MOUNTED] ??= /* @__PURE__ */ new Set();
}
/**
* Wrap a cordis plugin apply so the package runs at most once per process.
* @param packageName - npm package identity shared by every install source.
* @param fn - the original plugin apply.
* @returns an apply of the same shape.
*/
function mountOnce(packageName, fn) {
	return ((...args) => {
		const mounted = mountedSet();
		if (mounted.has(packageName)) return;
		mounted.add(packageName);
		args[0]?.effect?.(() => () => {
			mounted.delete(packageName);
		});
		return fn(...args);
	});
}
//#endregion
//#region src/index.ts
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "notes";
/** Services required before the notes plugin can mount its surfaces. */
const inject = ["webServer"];
/**
* Settings schema: enable switches for the browser half plus the UI
* preferences (dock placement, button size, default scope). The browser
* half reads them through its settings scope AND the state endpoint.
*/
function makeNotesSettingsSchema() {
	return z.object({
		enabled: z.boolean().default(true),
		selectionCapture: z.boolean().default(true),
		dockMode: z.union([z.const("floating"), z.const("fixed")]).default("floating"),
		buttonSize: z.union([
			z.const("small"),
			z.const("regular"),
			z.const("large")
		]).default("large"),
		defaultGlobal: z.boolean().default(false)
	});
}
/** Register the notes service and its API routes on the context. */
const apply = mountOnce("dsh-web-notes", applyImpl);
function applyImpl(ctx, config = {}) {
	const service = new NotesService(ctx, config);
	const base = {
		enabled: config.enabled ?? true,
		selectionCapture: config.selectionCapture ?? true,
		dockMode: config.dockMode ?? "floating",
		buttonSize: config.buttonSize ?? "large",
		defaultGlobal: config.defaultGlobal ?? false
	};
	let current = () => base;
	const routes = makeNotesRoutes(service);
	let disposeRoutes;
	const syncRoutes = () => {
		const enabled = current().enabled;
		if (disposeRoutes === void 0 && enabled) disposeRoutes = ctx.effect(() => {
			const disposers = routes.map((route) => ctx.webServer.register(route));
			return () => {
				for (const dispose of disposers) dispose();
			};
		}, "notes: routes");
		else if (disposeRoutes !== void 0 && !enabled) {
			disposeRoutes();
			disposeRoutes = void 0;
		}
	};
	installSettingsSection(ctx, settingsNamespace(NOTES_SETTINGS_NAMESPACE), makeNotesSettingsSchema(), base, {
		setSource: (source) => {
			current = source;
		},
		onChange: () => {
			const section = current();
			service.applySettingsSection(section);
			syncRoutes();
		}
	});
	syncRoutes();
}
//#endregion
export { DEFAULT_NOTE_TITLE, NOTES_API_PREFIX, NOTES_MAX, NOTES_SETTINGS_NAMESPACE, NOTE_CONTENT_MAX, NOTE_TAGS_MAX, NOTE_TITLE_MAX, NotesService, apply, dshHome, inject, loadNotesPersist, makeNotesRoutes, makeNotesSettingsSchema, name, notesHomeDir, saveNotesPersist };
