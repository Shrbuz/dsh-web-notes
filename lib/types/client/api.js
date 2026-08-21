/**
 * Notes browser API — same-origin JSON endpoints served by the host half
 * (loopback-guarded /api/notes/*). The client bundle never imports host
 * packages; this is its only channel to the notes store.
 * @module dsh-web-notes/client/api
 */
/** Same-origin JSON fetch helper (GET without body, POST with JSON body). */
async function notesFetch(path, body) {
    const response = await fetch(path, body === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
        });
    if (!response.ok) {
        throw new Error('notes ' + path + ' failed: ' + response.status);
    }
    return (await response.json());
}
/** The live API instance (failures surface per call). */
export function createNotesApi() {
    return {
        state: () => notesFetch('/api/notes/state'),
        list: (query, opts) => {
            const params = new URLSearchParams();
            if (query !== undefined && query.trim() !== '')
                params.set('q', query.trim());
            if (typeof opts?.session === 'string' && opts.session !== '')
                params.set('session', opts.session);
            if (opts?.scope !== undefined && opts.scope !== 'all')
                params.set('scope', opts.scope);
            const suffix = params.toString();
            return notesFetch('/api/notes/list' + (suffix === '' ? '' : '?' + suffix));
        },
        create: (input) => notesFetch('/api/notes/create', input),
        update: (id, patch) => notesFetch('/api/notes/update', { id, ...patch }),
        remove: (id) => notesFetch('/api/notes/delete', { id }),
    };
}
