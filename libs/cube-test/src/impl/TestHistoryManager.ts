/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Application, HistoryManager, Place } from 'wdc-cube'

/**
 * A history that lives in memory instead of in a browser.
 *
 * `location` is writable, which is what lets a test start the application
 * anywhere: an application reads it while kick-starting and flips there, so
 * setting it before boot reproduces a reload or a shared link — the case where
 * nothing has been visited yet, and the one most likely to be wrong.
 *
 * Every token the application publishes is kept, so a test can assert what the
 * address bar would have shown at each step rather than only at the end.
 */
export class TestHistoryManager extends HistoryManager {
    /** What the address bar holds: encoded, when there is a codec. */
    private __location: string

    private readonly __tokens: string[] = []

    private readonly __encodedTokens: string[] = []

    public constructor(location = '') {
        super()
        this.__location = location
    }

    /**
     * The address as the application reads it: plain, like the real one.
     *
     * A test may set an encoded address to reproduce a shared link, or a plain
     * one to reproduce a bookmark older than the codec. Both work, because a
     * query that carries no envelope is handed back untouched.
     */
    public override get location(): string {
        return this.withQuery(this.__location, (query) => this.decodeQuery(query))
    }

    public set location(value: string) {
        this.__location = value
    }

    /**
     * The token the application published last, or `''` before the first one.
     *
     * Plain, always, so that an assertion stays readable when an application
     * turns a codec on. What travelled is {@link encodedToken}.
     */
    public get token(): string {
        return this.__tokens.length > 0 ? this.__tokens[this.__tokens.length - 1] : ''
    }

    /** Every token published so far, oldest first, in plain text. */
    public get tokens(): readonly string[] {
        return this.__tokens
    }

    /**
     * The last token in the form it would have travelled in.
     *
     * Identical to {@link token} when there is no codec. With one, this is what
     * a test asserts against to prove that something did *not* reach the address
     * bar — which is the only claim a codec makes.
     */
    public get encodedToken(): string {
        return this.__encodedTokens.length > 0 ? this.__encodedTokens[this.__encodedTokens.length - 1] : ''
    }

    /** Every token published so far, oldest first, as each one travelled. */
    public get encodedTokens(): readonly string[] {
        return this.__encodedTokens
    }

    public override update(app: Application, place: Place): void {
        const token = app.newFlipIntent(place).toString()
        const encoded = this.withQuery(token, (query) => this.encodeQuery(query))

        this.__location = encoded

        // Flips that do not change the address are noise in an assertion, and
        // the comparison is on the plain form: a codec is allowed to produce a
        // different envelope for the same state, and comparing envelopes would
        // record a token per flip whether or not anything moved.
        if (token !== this.token) {
            this.__tokens.push(token)
            this.__encodedTokens.push(encoded)
        }
    }

    /**
     * Applies `transform` to the query half of an intent string.
     *
     * A token is `place?query`, not `path + search`: the codec only ever sees
     * the query, and the place has to stay legible for the same reason it does
     * in the browser.
     */
    private withQuery(token: string, transform: (query: string) => string): string {
        const cut = token.indexOf('?')
        if (cut < 0) {
            return token
        }

        const query = transform(token.slice(cut + 1))
        return query ? `${token.slice(0, cut)}?${query}` : token.slice(0, cut)
    }

    /**
     * Moves to `location` and tells the application, the way a browser does when
     * the user edits the address or presses Back.
     */
    public navigate(location: string): void {
        this.__location = location
        this.notifyChanges()
    }

    public clearTokens(): void {
        this.__tokens.length = 0
        this.__encodedTokens.length = 0
    }
}
