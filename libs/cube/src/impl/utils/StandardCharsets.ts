/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

export interface Charset {
    encode(value: string): Uint8Array
    decode(value: Uint8Array): string
}

const UTF8_ENCODER = new TextEncoder()
const UTF8_DECODER = new TextDecoder('utf-8')
const ASCII_DECODER = new TextDecoder('ascii')

class AsciiCharset implements Charset {
    public encode(value: string): Uint8Array {
        const bytes = new Uint8Array(value.length)
        for (let i = 0; i < value.length; i++) {
            bytes[i] = value.charCodeAt(i)
        }
        return bytes
    }

    public decode(value: Uint8Array): string {
        return ASCII_DECODER.decode(value)
    }
}

class Utf8Charset implements Charset {
    encode(value: string): Uint8Array {
        return UTF8_ENCODER.encode(value)
    }

    decode(value: Uint8Array): string {
        return UTF8_DECODER.decode(value)
    }
}

export class StandardCharsets {
    public static readonly ASCII: Charset = new AsciiCharset()
    public static readonly UTF_8: Charset = new Utf8Charset()
}
