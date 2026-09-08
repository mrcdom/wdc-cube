import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

/**
 * Starts the worker that answers the application's requests.
 *
 * Nothing but this knows the API is not a server. The service makes ordinary
 * `fetch` calls; a worker happens to answer them, which is what lets the
 * showcase be a static deployment whose link works for anyone who opens it.
 *
 * Where the worker script is served from is the caller's to say: it has to come
 * from the application's own origin, so it is a file in each renderer's public
 * directory and each renderer knows its own base path. That one string is the
 * whole of what a renderer contributes to having a backend.
 */
export async function startFakeApi(serviceWorkerUrl: string): Promise<void> {
    const worker = setupWorker(...handlers)
    await worker.start({
        // Anything the application did not ask for — the page, its modules, a
        // font — is none of the worker's business.
        onUnhandledRequest: 'bypass',
        quiet: true,
        serviceWorker: { url: serviceWorkerUrl }
    })
}
