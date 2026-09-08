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
    private __location: string

    private readonly __tokens: string[] = []

    public constructor(location = '') {
        super()
        this.__location = location
    }

    public override get location(): string {
        return this.__location
    }

    public set location(value: string) {
        this.__location = value
    }

    /** The token the application published last, or `''` before the first one. */
    public get token(): string {
        return this.__tokens.length > 0 ? this.__tokens[this.__tokens.length - 1] : ''
    }

    /** Every token published so far, oldest first. */
    public get tokens(): readonly string[] {
        return this.__tokens
    }

    public override update(app: Application, place: Place): void {
        const token = app.newFlipIntent(place).toString()
        this.__location = token
        // Flips that do not change the address are noise in an assertion.
        if (token !== this.token) {
            this.__tokens.push(token)
        }
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
    }
}
