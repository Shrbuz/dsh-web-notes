/**
 * DSH_HOME resolution shared by plugin host halves: the environment override
 * wins, the platform home fallback follows (same semantics as the official
 * dsh-home-paths package and the dsh-web-ui plugin family).
 * @module dsh-web-notes/dsh-home
 */

import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'

/** Expand a leading ~ (or ~user) in a path, platform-style. */
export function expandHome(path: string, home: string = homedir()): string {
  if (path === '~') return home
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(home, path.slice(2))
  return path
}

/**
 * Resolve the DSH home directory.
 * @param env - process environment to read DSH_HOME from.
 * @param home - platform home directory fallback (test seam).
 * @returns the absolute DSH home path.
 */
export function resolveDshHome(env: NodeJS.ProcessEnv = process.env, home: string = homedir()): string {
  const raw = env.DSH_HOME
  if (raw !== undefined && raw.trim() !== '') {
    const expanded = expandHome(raw.trim(), home)
    return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded)
  }
  return join(home, '.dsh')
}

/** Resolve the DSH home directory from the live environment. */
export function dshHome(): string {
  return resolveDshHome()
}
