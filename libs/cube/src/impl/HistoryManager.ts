/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Place } from './Place.js'
import { Application } from './Application.js'
import type { HistoryCodec } from './HistoryCodec.js'

export type HistoryChangeListener = (sender: HistoryManager) => void

export class HistoryManager {
    public static NOOP = new HistoryManager()

    private __changeListenerMap = new Map<number, HistoryChangeListener>()

    private __listenerIdGen = 0

    /**
     * What transforms the query on its way to the address bar, if anything.
     *
     * Absent by default, and absent means nothing changes: every helper below
     * hands the string straight back. An application can also swap it at
     * runtime — signing in and out are the obvious moments — and then ask for
     * the address to be written again.
     */
    public codec?: HistoryCodec

    /**
     * The address as the framework reads it: always plain text.
     *
     * This is the point the whole seam turns on. Four places read this — two in
     * the framework and two in the applications — and one of them decides
     * "did the address change?" by comparing strings. A codec is allowed to be
     * non-deterministic, so ciphertext here would compare unequal to itself and
     * put the application in a navigation loop.
     */
    public get location() {
        return ''
    }

    /**
     * The query as it should travel, given the codec.
     *
     * Returns the input untouched when there is no codec, and when the codec
     * declines. Otherwise the whole query becomes a single named parameter, so
     * that anything reparsing the URL still finds valid syntax and so that
     * "is this encoded?" is answered by the presence of one name.
     */
    protected encodeQuery(queryString: string): string {
        if (!this.codec || !queryString) {
            return queryString
        }

        const payload = this.codec.encode(queryString)
        return payload === undefined ? queryString : `${this.codec.envelope}=${payload}`
    }

    /**
     * The inverse, and the reason a plain address keeps working.
     *
     * A query without the envelope parameter is handed back as it came: that is
     * what lets a bookmark saved before the codec existed still open, and what
     * makes adopting one an address-at-a-time affair rather than a migration.
     *
     * A failure to decode yields an empty query — the place opens in its default
     * state, which is the least surprising thing for a link that has aged past
     * its key. Telling the application *why* it failed is what the policy in
     * phase 3 is for.
     */
    protected decodeQuery(queryString: string): string {
        if (!this.codec || !queryString) {
            return queryString
        }

        const payload = readEnvelope(queryString, this.codec.envelope)
        if (payload === undefined) {
            return queryString
        }

        return this.codec.decode(payload) ?? ''
    }

    public update(app: Application, place: Place): void {
        // NOOP
    }

    public addChangeListener(listener: HistoryChangeListener) {
        const listenerId = this.__listenerIdGen++
        this.__changeListenerMap.set(listenerId, listener)
        return () => {
            this.__changeListenerMap.delete(listenerId)
        }
    }

    public notifyChanges() {
        if (this.__changeListenerMap.size > 0) {
            for (const listener of this.__changeListenerMap.values()) {
                listener(this)
            }
        }
    }
}

/**
 * The envelope's payload, if this query is one.
 *
 * An envelope is the whole query and nothing else — one parameter, the codec's
 * own. Anything else is plain text that happens to be next to it, and treating
 * it as an envelope would be guessing.
 */
function readEnvelope(queryString: string, envelope: string): string | undefined {
    const prefix = `${envelope}=`
    if (!queryString.startsWith(prefix) || queryString.includes('&')) {
        return undefined
    }
    return queryString.slice(prefix.length)
}
