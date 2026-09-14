/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { aessiv } from '@noble/ciphers/aes.js'
import { deflateSync, inflateSync } from 'fflate'
import type { HistoryCodec } from '../impl/HistoryCodec.js'

/**
 * A reference `HistoryCodec`: AES-SIV over the query, base64url on the wire.
 *
 * It ships behind its own subpath, `wdc-cube/codec`, and behind optional peer
 * dependencies. Importing `wdc-cube` does not reach it, and an application that
 * never seals an address never downloads a cipher — which is the whole reason
 * the seam and the implementation are separable at all.
 *
 * ## The envelope
 *
 *     _e=base64url( [version:1][flags:1][ciphertext+tag:N+16] )
 *
 * **One named parameter** rather than an opaque query, so anything that
 * reparses the URL still finds valid syntax, and so "is this encoded?" is
 * answered by the presence of one name.
 *
 * **A version byte**, which is what makes a key rotatable. It selects the key
 * to open with, so addresses sealed before a rotation keep working for as long
 * as their key is still offered — and one sealed under a version no longer
 * offered fails cleanly instead of decrypting to nonsense.
 *
 * **A flags byte**, whose bit 0 says deflate was applied. See {@link pack}: it
 * usually is not.
 *
 * **No nonce field.** AES-SIV is deterministic by definition — the nonce is
 * optional and left out — which is 12 bytes off every address and, more
 * importantly, what makes the same state produce the same address every time.
 *
 * ## Why deterministic, and what it costs
 *
 * Two requirements are easy to confuse. *Durability* is that an address
 * produced today still opens in six months; it needs only a stable key.
 * *Stability* is that the same state always produces the same address, so that
 * copying it twice gives the same string — and that is what needs determinism.
 *
 * Stability holds **within a key version**. Rotating the key changes every
 * address it produces, which is inherent rather than a defect: a new key is a
 * new cipher. It is also why rotation offers the old keys for reading rather
 * than rewriting anything — a link somebody already copied is out of reach.
 *
 * Fixing the nonce of plain AES-GCM would be catastrophic rather than
 * economical: GCM is a stream cipher, so two messages under one nonce give
 * `C1 XOR C2 = P1 XOR P2` — and addresses are nearly identical to each other,
 * so that XOR reveals almost everything. Worse, two messages under one nonce
 * also solve for GHASH's subkey, after which tags can be forged with that key
 * forever. AES-SIV derives its tag from the plaintext instead, which is what
 * makes repetition safe.
 *
 * What determinism does leak is **equality**: someone reading the history can
 * tell the reader returned to the same state, without knowing which. The path
 * and the timestamp are already in the clear, so the increment is small.
 *
 * ## What this does not do
 *
 * **It does not produce, derive, transport or store a key.** It receives 32
 * bytes. Where they come from is the application's question and its server's,
 * and the answer differs per deployment — a constant in the bundle is
 * obfuscation rather than secrecy, and a key derived per user at sign-in is the
 * shape a real one takes.
 *
 * **It is not authorisation, and not a substitute for validating on arrival.**
 * A legitimate link from three months ago can still carry `page=999999` for a
 * list that has since shrunk. Sealing an address proves it came from the
 * application; it does not make its contents true.
 */
const FLAG_DEFLATED = 1

/** Constant on purpose: AES-SIV is built for exactly this. */
const NONCE = new Uint8Array(0)

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * A key, as 32 raw bytes or as the 43 base64url characters that carry them.
 *
 * The string form is accepted because that is how a key arrives — a server
 * hands it over as JSON, and every application otherwise writes the same
 * decoder, usually reaching for `atob` and forgetting that base64url spells two
 * of its characters differently.
 */
export type HistoryKey = Uint8Array | string

/** One key and the envelope byte that selects it. */
export interface HistoryKeyVersion {
    /** 1 to 255, and stable for the life of the key it names. */
    version: number
    key: HistoryKey
}

export interface HistoryCodecOptions {
    /** What every new address is sealed with. */
    current: HistoryKeyVersion

    /**
     * Keys kept for reading only — the grace period of a rotation.
     *
     * An address sealed under one of these still opens, and the next time the
     * application publishes that address it is sealed under `current`, so links
     * in a reader's own history migrate as they are used. A link somebody
     * copied elsewhere migrates never, which is what decides how long a version
     * stays on this list.
     */
    previous?: HistoryKeyVersion[]

    /** The parameter name the envelope travels in. Defaults to `_e`. */
    envelope?: string
}

/**
 * Deflates only when deflating helps.
 *
 * It usually does not, and the reason is arithmetic rather than opinion.
 * LZ77 refers back to what it has already seen, and in the first hundred bytes
 * nothing has; Huffman has to carry its code table. Then base64url charges 33%
 * for the trip, so compression has to save more than a quarter just to break
 * even. Measured over real addresses, `page=2` deflates from 6 bytes to 8.
 *
 * The turning point is somewhere near 200 characters. Below it this returns the
 * bytes untouched, and the flag says so.
 */
function pack(plain: Uint8Array): { bytes: Uint8Array; deflated: boolean } {
    const deflated = deflateSync(plain, { level: 9 })
    return deflated.length < plain.length ? { bytes: deflated, deflated: true } : { bytes: plain, deflated: false }
}

const toBase64Url = (bytes: Uint8Array) => {
    let binary = ''
    for (const byte of bytes) {
        binary += String.fromCharCode(byte)
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (payload: string) => {
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

/**
 * 32 bytes, whatever form they arrived in.
 *
 * The length is checked here rather than left to the cipher, because the error
 * a cipher raises names its own internals and this one names the mistake.
 */
function toKeyBytes(key: HistoryKey, label: string): Uint8Array {
    let bytes: Uint8Array
    if (typeof key === 'string') {
        try {
            bytes = fromBase64Url(key)
        } catch {
            throw new Error(`${label} is not base64url`)
        }
    } else {
        bytes = key
    }

    if (bytes.length !== 32) {
        throw new Error(`${label} is 32 bytes; received ${bytes.length}`)
    }

    return bytes
}

function toVersionByte(version: number, label: string): number {
    if (!Number.isInteger(version) || version < 1 || version > 255) {
        throw new Error(`${label} is an integer from 1 to 255; received ${version}`)
    }
    return version
}

/**
 * Builds the codec.
 *
 * Two forms. A single key is the whole of what most applications need:
 *
 * ```ts
 * historyManager.codec = createHistoryCodec(keyFromServer)
 * ```
 *
 * and a rotation offers the old keys for reading while sealing with the new:
 *
 * ```ts
 * historyManager.codec = createHistoryCodec({
 *     current: { version: 2, key: newKey },
 *     previous: [{ version: 1, key: oldKey }]
 * })
 * ```
 *
 * The cipher is constructed per call rather than kept: `@noble/ciphers` refuses
 * a second `encrypt()` on one instance, guarding against nonce reuse across the
 * board — and a deterministic codec encrypts the same state over and over by
 * design. Measured at 5 to 13µs per call, against the 16ms the address write is
 * already debounced by.
 */
export function createHistoryCodec(key: HistoryKey, envelope?: string): HistoryCodec
export function createHistoryCodec(options: HistoryCodecOptions): HistoryCodec
export function createHistoryCodec(
    keyOrOptions: HistoryKey | HistoryCodecOptions,
    envelopeArgument = '_e'
): HistoryCodec {
    const options: HistoryCodecOptions =
        typeof keyOrOptions === 'string' || keyOrOptions instanceof Uint8Array
            ? { current: { version: 1, key: keyOrOptions }, envelope: envelopeArgument }
            : keyOrOptions

    const envelope = options.envelope ?? '_e'

    const current = toVersionByte(options.current.version, 'A history key version')
    const currentKey = toKeyBytes(options.current.key, 'A history key')

    // Version to key, for reading. `current` is in here too: an address just
    // written has to open by the same path as an old one.
    const keys = new Map<number, Uint8Array>([[current, currentKey]])
    for (const entry of options.previous ?? []) {
        const version = toVersionByte(entry.version, 'A previous history key version')
        if (keys.has(version)) {
            throw new Error(`History key version ${version} is offered twice`)
        }
        keys.set(version, toKeyBytes(entry.key, `The history key for version ${version}`))
    }

    return {
        envelope,

        encode(queryString) {
            const { bytes, deflated } = pack(encoder.encode(queryString))
            const sealed = aessiv(currentKey, NONCE).encrypt(bytes)

            const envelopeBytes = new Uint8Array(2 + sealed.length)
            envelopeBytes[0] = current
            envelopeBytes[1] = deflated ? FLAG_DEFLATED : 0
            envelopeBytes.set(sealed, 2)

            return toBase64Url(envelopeBytes)
        },

        decode(payload) {
            try {
                const envelopeBytes = fromBase64Url(payload)
                if (envelopeBytes.length < 2) {
                    return undefined
                }

                const key = keys.get(envelopeBytes[0])
                if (!key) {
                    // A version this build no longer offers — the grace period
                    // for that key has closed. Failing here is the point of the
                    // byte: better a clean miss than plausible nonsense.
                    return undefined
                }

                const opened = aessiv(key, NONCE).decrypt(envelopeBytes.subarray(2))
                const bytes = (envelopeBytes[1] & FLAG_DEFLATED) === FLAG_DEFLATED ? inflateSync(opened) : opened
                return decoder.decode(bytes)
            } catch {
                // Wrong key, tampered with, or not an envelope at all. The
                // framework reads `undefined` as "I could not".
                return undefined
            }
        }
    }
}
