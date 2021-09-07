import { CastUtils } from './CastUtils'
import { StandardCharsets, Charset } from './StandardCharsets'
import { WebFlowURI } from './WebFlowURI'

export class QueryStringParser {

    /**
     * Append request parameters from the specified String to the specified Map. It is presumed that the specified Map is not accessed from any other thread, so no synchronization
     * is performed.
     * <p>
     * <strong>IMPLEMENTATION NOTE</strong>: URL decoding is performed individually on the parsed name and value elements, rather than on the entire query string ahead of time, to
     * properly deal with the case where the name or value includes an encoded "=" or "&" character that would otherwise be interpreted as a delimiter.
     *
     * @param uri
     *            Map that accumulates the resulting parameters
     * @param data
     *            Input string containing request parameters
     *
     * @exception IllegalArgumentException
     *                if the data is bad-formed
     */
    public static parse(uri: WebFlowURI, data: string, encoding: Charset): void {
        if (data != null && data.length > 0) {
            // use the specified encoding to extract bytes out of the
            // given string so that the encoding is not lost. If an
            // encoding is not specified, let it use platform default
            const bytes = encoding != null ? encoding.encode(data) : StandardCharsets.ASCII.encode(data)
            this.parseParameters(uri, bytes, encoding)
        }
    }

    /**
     * Convert a byte character value to hex-decimal digit value.
     *
     * @param b
     *            the character value byte
     */
    private static convertHexDigit(b: number): number {
        if (b >= 48 && b <= 57) {
            return (b - 48) | 0
        }
        if (b >= 97 && b <= 102) {
            return (b - 97 + 10) | 0
        }
        if (b >= 65 && b <= 70) {
            return (b - 65 + 10) | 0
        }
        return 0
    }

    /**
     * Put name and value pair in map. When name already exist, add value to array of values.
     *
     * @param uri
     *            The map to populate
     * @param name
     *            The parameter name
     * @param value
     *            The parameter value
     */
    private static putMapEntry(uri: WebFlowURI, name: string, value: string): void {
        const oldValue = uri.getParameterRawValue(name)

        if (oldValue === undefined || oldValue === null) {
            uri.setParameter(name, value)
        } else if (CastUtils.isArray(oldValue)) {
            const array = oldValue as Array<unknown>
            array.push(CastUtils.toUnknown(value, CastUtils.getArrayType(array)))
        } else {
            const array = new Array<unknown>(2)
            array[0] = oldValue
            array[1] = CastUtils.toUnknown(value, CastUtils.getType(oldValue))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uri.setParameter(name, array as any)
        }
    }

    /**
     * Append request parameters from the specified String to the specified Map. It is presumed that the specified Map is not accessed from any other thread, so no synchronization
     * is performed.
     * <p>
     * <strong>IMPLEMENTATION NOTE</strong>: URL decoding is performed individually on the parsed name and value elements, rather than on the entire query string ahead of time, to
     * properly deal with the case where the name or value includes an encoded "=" or "&" character that would otherwise be interpreted as a delimiter.
     *
     * NOTE: byte array data is modified by this method. Caller beware.
     *
     * @param uri
     *            Map that accumulates the resulting parameters
     * @param data
     *            Input string containing request parameters
     * @param encoding
     *            Encoding to use for converting hex
     *
     * @exception UnsupportedEncodingException
     *                if the data is malformed
     */
    public static parseParameters(uri: WebFlowURI, data: Uint8Array, encoding: Charset): void {
        if (data != null && data.length > 0) {
            let ix = 0
            let ox = 0
            let key: string | null = null
            let value: string | null = null
            while (ix < data.length) {
                const c = data[ix++]
                switch (String.fromCharCode(c)) {
                    case '&':
                        value = encoding.decode(data.subarray(0, ox))
                        if (key != null) {
                            this.putMapEntry(uri, key, value)
                            key = null
                        }
                        ox = 0
                        break
                    case '=':
                        if (key == null) {
                            key = encoding.decode(data.subarray(0, ox))
                            ox = 0
                        } else {
                            data[ox++] = c
                        }
                        break
                    case '+':
                        data[ox++] = 32
                        break
                    case '%':
                        data[ox++] = (this.convertHexDigit(data[ix++]) << 4) + this.convertHexDigit(data[ix++])
                        break
                    default:
                        data[ox++] = c
                }
            }
            // The last value does not end in '&'. So save it now.
            if (key != null) {
                value = encoding.decode(data.subarray(0, ox))
                this.putMapEntry(uri, key, value)
            }
        }

    }

}