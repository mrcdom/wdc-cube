import { fromUtf8, toUtf8 } from '@aws-sdk/util-utf8-browser';
class AsciiCharset {
    encode(value) {
        const bytes = new Uint8Array(value.length);
        for (let i = 0; i < value.length; i++) {
            bytes[i] = value.charCodeAt(i);
        }
        return bytes;
    }
    decode(value) {
        return String.fromCharCode.apply(null, value);
    }
}
class Utf8Charset {
    encode(value) {
        return fromUtf8(value);
    }
    decode(value) {
        return toUtf8(value);
    }
}
export class StandardCharsets {
}
StandardCharsets.ASCII = new AsciiCharset();
StandardCharsets.UTF_8 = new Utf8Charset();
//# sourceMappingURL=StandardCharsets.js.map