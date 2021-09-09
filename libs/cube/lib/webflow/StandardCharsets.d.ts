export interface Charset {
    encode(value: string): Uint8Array;
    decode(value: Uint8Array): string;
}
export declare class StandardCharsets {
    static readonly ASCII: Charset;
    static readonly UTF_8: Charset;
}
