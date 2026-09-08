import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

/**
 * Starts the worker that answers the application's requests.
 *
 * Nothing but this file knows the API is not a server. The service makes
 * ordinary `fetch` calls; a worker happens to answer them, which is what lets
 * the showcase be a static deployment whose link works for anyone who opens it.
 */
export async function startFakeApi(): Promise<void> {
    const worker = setupWorker(...handlers)
    await worker.start({
        // Anything the application did not ask for — the page, its modules, a
        // font — is none of the worker's business.
        onUnhandledRequest: 'bypass',
        quiet: true,
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` }
    })
}
