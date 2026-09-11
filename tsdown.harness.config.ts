/**
 * Harness build — bundles `scripts/harness/entry.tsx` into ONE self-contained
 * IIFE (.logs/harness/harness.js) with React and the notes client sources
 * inlined, so it can be loaded from a plain `file://` page in headless Chrome.
 *
 * Deliberately separate from tsdown.config.ts: the shipped artifacts must keep
 * react/react-dom EXTERNAL (the loader module table provides them) and keep the
 * `window.__ModuleLoader__.load(...)` closure wrapper. The harness has no
 * loader, so it inlines everything and ships no wrapper.
 *
 * Not part of `pnpm run build` and not inside tsconfig's `include` — this is a
 * dev-only verification tool.
 */
import type { UserConfig } from 'tsdown'

const harness: UserConfig = {
  name: 'dsh-web-notes-harness',
  entry: { harness: 'scripts/harness/entry.tsx' },
  outDir: '.logs/harness',
  format: ['iife'],
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: false,
  clean: false,
  deps: {
    // No loader exists on a file:// page: every dependency must inline.
    alwaysBundle: () => true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  outputOptions: {
    entryFileNames: 'harness.js',
  },
}

export default [harness]
