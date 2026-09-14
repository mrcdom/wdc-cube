/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

/**
 * Turns the query string between the form the application understands and the
 * form that travels in the address bar.
 *
 * Cube implements none: it only calls. Encrypting, compressing, signing or
 * shortening are the application's decisions, with the application's
 * dependencies — the core stays without any.
 *
 * Only the query is transformed. The path stays legible, because a place has to
 * be resolved *before* any key exists — a guard needs to know where the reader
 * was going in order to send them to the door and back — and because a readable
 * link is half of what an addressable URL is for.
 *
 * It is synchronous on purpose. `HistoryManager.location` is a getter read on
 * the navigation path, and making it asynchronous would spread through
 * `kickStart` and through the handling of history events, with a window where
 * two of them could be processed out of order. Deriving a key is asynchronous
 * and happens once, before any of that, producing a codec already prepared.
 */
export interface HistoryCodec {
    /**
     * The name of the parameter that carries the envelope.
     *
     * An address without it is plain text, and that is what makes adoption
     * incremental: a bookmark saved before the codec existed still opens. It is
     * the codec's to choose, so an application can avoid colliding with a
     * parameter of its own.
     */
    readonly envelope: string

    /**
     * `'name=ana&page=2'` to whatever travels. `undefined` publishes the plain
     * text, which is what lets a codec decline — an address with nothing worth
     * hiding, say.
     *
     * The result has to be safe as a query parameter's value, and in particular
     * must not contain `&`. An envelope is one parameter and the whole query;
     * `_e=a&b` would be ambiguous, and anything reparsing the URL would read it
     * as two. base64url, which is what an encrypted payload arrives as, is
     * already safe — it has no `&` and needs no escaping.
     */
    encode(queryString: string): string | undefined

    /**
     * The inverse. `undefined` means "I could not": wrong key, tampered with, a
     * version this build no longer reads.
     */
    decode(payload: string): string | undefined
}
