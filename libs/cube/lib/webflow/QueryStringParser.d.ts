import { Charset } from './StandardCharsets';
import { WebFlowURI } from './WebFlowURI';
export declare class QueryStringParser {
    static parse(uri: WebFlowURI, data: string, encoding: Charset): void;
    private static convertHexDigit;
    private static putMapEntry;
    static parseParameters(uri: WebFlowURI, data: Uint8Array, encoding: Charset): void;
}
