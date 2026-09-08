import { setupWorker } from 'msw/browser'

import { buildHandlers } from './handlers'

/**
 * Starts the worker that answers the application's requests.
 *
 * Nothing but this knows the API is not a server. The service makes ordinary
 * `fetch` calls; a worker happens to answer them, which is what lets the
 * showcase be a static deployment whose link works for anyone who opens it.
 *
 * The base path is the caller's to give, and it is the only thing a renderer
 * contributes to having a backend. Everything here follows from it: the worker
 * script has to come from the application's own origin, and the endpoints have
 * to be rooted where the application is. Deployed under `/wdc-cube/`, a handler
 * written as `/api/session` never fires — the page asks for
 * `/wdc-cube/api/session`, the request goes to the network, and what comes back
 * is the page's own HTML.
 */
export async function startFakeApi(base = '/'): Promise<void> {
    const worker = setupWorker(...buildHandlers(`${base}api`))
    await worker.start({
        // Anything the application did not ask for — the page, its modules, a
        // font — is none of the worker's business.
        onUnhandledRequest: 'bypass',
        quiet: true,
        serviceWorker: { url: `${base}mockServiceWorker.js` }
    })
}
