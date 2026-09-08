/**
 * What a browser has and jsdom does not.
 *
 * Spectrum's components are Lit elements that measure themselves; jsdom has no
 * layout, so the observers they reach for have to exist even though they will
 * never report anything. Only the views that use a Spectrum component need this,
 * but a setup file costs nothing and keeps that out of the tests.
 */
class NoopObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
        return []
    }
}

globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver
globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver

globalThis.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
})) as unknown as typeof matchMedia
