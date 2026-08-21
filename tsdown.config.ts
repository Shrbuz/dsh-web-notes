/**
 * dsh-notes build — two artifacts in one tsdown run:
 *
 * 1. Node half (`lib/index.js`, ESM): the cordis plugin body. The
 *    @deepseek-ai/* host packages and node builtins stay external and resolve
 *    from the dsh profile tree at runtime.
 * 2. Browser half (`lib/client.js`, CJS closure): registers through
 *    window.__ModuleLoader__.load({ id, factory }) and resolves externals
 *    through the injected require (the shell's frozen module table). This is
 *    the exact artifact shape the web plugin table serves under
 *    /plugins/dsh-notes/client.js.
 *
 * Styles live as a TS string (src/client/styles.ts) and are injected by the
 * bundle at factory execution — no CSS pipeline dependency.
 */
import type { UserConfig } from 'tsdown'

/**
 * The shell's frozen browser module table (mirrors dsh-web-frontend
 * staticModules; see the dsh-web-ui repo's shared/web-platform.ts): the only
 * specifiers a client bundle may require at runtime.
 */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
] as const

/** Documented runtime exemption: the snapshot-store engine lives in runtime. */
const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'

/** Externals resolved from the loader module table. */
const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION]

/** The plugin id stamped into the loader handoff and diagnostics. */
const PLUGIN_ID = 'dsh-web-notes'

const lib: UserConfig = {
  name: PLUGIN_ID,
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  // The cordis framework and peer host packages resolve from the dsh profile
  // tree at runtime, never from this package's install. schemastery is a
  // `dependencies` entry and is auto-externalized by tsdown.
  deps: {
    neverBundle: [
      '@deepseek-ai/cordis',
      '@deepseek-ai/dsh-host-webserver',
      '@deepseek-ai/dsh-settings',
    ],
  },
}

const client: UserConfig = {
  name: `${PLUGIN_ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    // Platform module table entries stay external (the loader answers them).
    neverBundle: [...CLIENT_EXTERNALS],
    // Everything else inlines into the bundle — a require() the loader table
    // cannot answer is a guaranteed runtime throw.
    alwaysBundle: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [lib, client]
