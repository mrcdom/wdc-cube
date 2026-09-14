import { aessiv } from '@noble/ciphers/aes.js'
import { deflateSync, inflateSync } from 'fflate'
import type { HistoryCodec } from 'wdc-cube'

/**
 * A reference `HistoryCodec`: AES-SIV over the query, base64url on the wire.
 *
 * It lives here, in the example, and not in `libs/cube`. The framework defines
 * the seam and calls it; choosing a cipher, a compressor and a key policy is
 * the application's business, with the application's dependencies. That is why
 * `wdc-cube` still has none.
 *
 * ## The envelope
 *
 *     _e=base64url( [version:1][flags:1][ciphertext+tag:N+16] )
 *
 * **One named parameter** rather than an opaque query, so anything that
 * reparses the URL still finds valid syntax, and so "is this encoded?" is
 * answered by the presence of one name.
 *
 * **A version byte**, so a key or an algorithm can be rotated without garbling:
 * an address from before the change fails cleanly instead of decrypting to
 * nonsense.
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
 * The key here is a constant in the bundle, which is **obfuscation, not
 * secrecy**: whoever downloads the application has it. That is the honest
 * shape for a public example, and it still buys what it is meant to buy — an
 * address that is not casually readable over a shoulder, in a screenshot, or in
 * a synced browser history — while keeping links shareable.
 *
 * A real deployment derives a key per user on the server and hands it over at
 * sign-in. The interface is the same; only {@link createHistoryCodec}'s
 * argument changes.
 *
 * And none of it is authorisation, nor a substitute for validating on arrival.
 * A legitimate link from three months ago can still carry `page=999999` for a
 * list that has since shrunk. Encryption proves an address came from the
 * application; it does not make its contents true.
 */
const VERSION = 1
const FLAG_DEFLATED = 1

/** Constant on purpose: AES-SIV is built for exactly this. */
const NONCE = new Uint8Array(0)

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Deflates only when deflating helps.
 *
 * It usually does not, and the reason is arithmetic rather than opinion.
 * LZ77 refers back to what it has already seen, and in the first hundred bytes
 * nothing has; Huffman has to carry its code table. Then base64url charges 33%
 * for the trip, so compression has to save more than a quarter just to break
 * even. Measured over this tutorial's own addresses, `page=2` deflates from 6
 * bytes to 8.
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
 * Builds the codec.
 *
 * `key` is 32 bytes. The cipher is constructed per call rather than kept:
 * `@noble/ciphers` refuses a second `encrypt()` on one instance, guarding
 * against nonce reuse across the board — and a deterministic codec encrypts the
 * same state over and over by design. Measured at 5 to 13µs per call, against
 * the 16ms the address write is already debounced by.
 */
export function createHistoryCodec(key: Uint8Array, envelope = '_e'): HistoryCodec {
    if (key.length !== 32) {
        throw new Error(`A history key is 32 bytes; received ${key.length}`)
    }

    return {
        envelope,

        encode(queryString) {
            const { bytes, deflated } = pack(encoder.encode(queryString))
            const sealed = aessiv(key, NONCE).encrypt(bytes)

            const envelopeBytes = new Uint8Array(2 + sealed.length)
            envelopeBytes[0] = VERSION
            envelopeBytes[1] = deflated ? FLAG_DEFLATED : 0
            envelopeBytes.set(sealed, 2)

            return toBase64Url(envelopeBytes)
        },

        decode(payload) {
            try {
                const envelopeBytes = fromBase64Url(payload)
                if (envelopeBytes.length < 2 || envelopeBytes[0] !== VERSION) {
                    // An address from before a rotation. Failing here is the
                    // point of the byte: better a clean miss than plausible
                    // nonsense.
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
