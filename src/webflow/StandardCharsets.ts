import { fromUtf8, toUtf8 } from '@aws-sdk/util-utf8-browser'

export interface Charset {
    encode(value: string): Uint8Array
    decode(value: Uint8Array): string
}

class AsciiCharset implements Charset {

    public encode(value: string): Uint8Array {
        const bytes = new Uint8Array(value.length)
        for (let i = 0; i < value.length; i++) {
            bytes[i] = value.charCodeAt(i)
        }
        return bytes
    }

    public decode(value: Uint8Array): string {
        return String.fromCharCode.apply(null, (value as unknown) as number[])
    }

}

class Utf8Charset implements Charset {

    encode(value: string): Uint8Array {
        return fromUtf8(value)
    }

    decode(value: Uint8Array): string {
        return toUtf8(value)
    }

}

export class StandardCharsets {
    public static readonly ASCII: Charset = new AsciiCharset()
    public static readonly UTF_8: Charset = new Utf8Charset()
}