export class CastUtils {
    static isInstanceOf(instance, ctor) {
        if (instance === undefined || instance === null) {
            return false;
        }
        return instance.constructor === ctor;
    }
    static isArray(value) {
        return CastUtils.isInstanceOf(value, Array);
    }
    static getType(item) {
        if (item !== undefined && item !== null) {
            if (CastUtils.isInstanceOf(item, String)) {
                return String;
            }
            if (CastUtils.isInstanceOf(item, Number)) {
                return Number;
            }
            if (CastUtils.isInstanceOf(item, Boolean)) {
                return Boolean;
            }
        }
        return undefined;
    }
    static getArrayType(array) {
        if (array && array.length > 0) {
            for (const item of array) {
                if (item) {
                    return CastUtils.getType(item);
                }
            }
        }
        return undefined;
    }
    static toUnknown(value, clazz) {
        if (value === undefined && value === null) {
            return undefined;
        }
        if (!clazz) {
            return value;
        }
        if (CastUtils.isInstanceOf(value, Number)) {
            if (clazz === Number) {
                return value;
            }
            if (clazz === String) {
                return String(value);
            }
            if (clazz === Boolean) {
                return value !== 0;
            }
            return value;
        }
        if (CastUtils.isInstanceOf(value, String)) {
            if (clazz === String) {
                return value;
            }
            const s = value;
            if (clazz === Number) {
                return s.includes('.') ? Number.parseFloat(s) : Number.parseInt(s);
            }
            if (clazz === Boolean) {
                return 'true' === s;
            }
            return s;
        }
        if (CastUtils.isInstanceOf(value, Boolean)) {
            if (clazz === Boolean) {
                return value;
            }
            const b = value;
            if (clazz === Number) {
                return b ? 1 : 0;
            }
            if (clazz === String) {
                return b ? 'true' : 'false';
            }
            return b;
        }
        return value;
    }
    static toString(value, defaultValue) {
        if (value !== null && value !== undefined) {
            const v = CastUtils.toUnknown(value, String);
            return v === null || v === undefined ? defaultValue : v;
        }
        return defaultValue;
    }
    static toNumber(value, defaultValue) {
        if (value !== null && value !== undefined) {
            const v = CastUtils.toUnknown(value, Number);
            return v === null || v === undefined ? defaultValue : v;
        }
        return defaultValue;
    }
    static toBoolean(value, defaultValue) {
        if (value) {
            const v = CastUtils.toUnknown(value, Boolean);
            return v === null || v === undefined ? defaultValue : v;
        }
        return defaultValue;
    }
}
//# sourceMappingURL=CastUtils.js.map