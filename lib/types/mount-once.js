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
const MOUNTED = Symbol.for('dsh-web-notes.mounted-plugins');
function mountedSet() {
    const registry = globalThis;
    return (registry[MOUNTED] ??= new Set());
}
/**
 * Wrap a cordis plugin apply so the package runs at most once per process.
 * @param packageName - npm package identity shared by every install source.
 * @param fn - the original plugin apply.
 * @returns an apply of the same shape.
 */
export function mountOnce(packageName, fn) {
    return ((...args) => {
        const mounted = mountedSet();
        if (mounted.has(packageName))
            return;
        mounted.add(packageName);
        const ctx = args[0];
        ctx?.effect?.(() => () => {
            mounted.delete(packageName);
        });
        return fn(...args);
    });
}
