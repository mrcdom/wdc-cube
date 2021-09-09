import { CastUtils } from './CastUtils';
import { StandardCharsets } from './StandardCharsets';
export class QueryStringParser {
    static parse(uri, data, encoding) {
        if (data != null && data.length > 0) {
            const bytes = encoding != null ? encoding.encode(data) : StandardCharsets.ASCII.encode(data);
            this.parseParameters(uri, bytes, encoding);
        }
    }
    static convertHexDigit(b) {
        if (b >= 48 && b <= 57) {
            return (b - 48) | 0;
        }
        if (b >= 97 && b <= 102) {
            return (b - 97 + 10) | 0;
        }
        if (b >= 65 && b <= 70) {
            return (b - 65 + 10) | 0;
        }
        return 0;
    }
    static putMapEntry(uri, name, value) {
        const oldValue = uri.getParameterRawValue(name);
        if (oldValue === undefined || oldValue === null) {
            uri.setParameter(name, value);
        }
        else if (CastUtils.isArray(oldValue)) {
            const array = oldValue;
            array.push(CastUtils.toUnknown(value, CastUtils.getArrayType(array)));
        }
        else {
            const array = new Array(2);
            array[0] = oldValue;
            array[1] = CastUtils.toUnknown(value, CastUtils.getType(oldValue));
            uri.setParameter(name, array);
        }
    }
    static parseParameters(uri, data, encoding) {
        if (data != null && data.length > 0) {
            let ix = 0;
            let ox = 0;
            let key = null;
            let value = null;
            while (ix < data.length) {
                const c = data[ix++];
                switch (String.fromCharCode(c)) {
                    case '&':
                        value = encoding.decode(data.subarray(0, ox));
                        if (key != null) {
                            this.putMapEntry(uri, key, value);
                            key = null;
                        }
                        ox = 0;
                        break;
                    case '=':
                        if (key == null) {
                            key = encoding.decode(data.subarray(0, ox));
                            ox = 0;
                        }
                        else {
                            data[ox++] = c;
                        }
                        break;
                    case '+':
                        data[ox++] = 32;
                        break;
                    case '%':
                        data[ox++] = (this.convertHexDigit(data[ix++]) << 4) + this.convertHexDigit(data[ix++]);
                        break;
                    default:
                        data[ox++] = c;
                }
            }
            if (key != null) {
                value = encoding.decode(data.subarray(0, ox));
                this.putMapEntry(uri, key, value);
            }
        }
    }
}
//# sourceMappingURL=QueryStringParser.js.map