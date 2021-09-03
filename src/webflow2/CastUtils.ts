export type PossibleParameterTypes = NumberConstructor | StringConstructor | BooleanConstructor

export class CastUtils {

    public static isArray(value: unknown): boolean {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (value && (value as any).constructor === Array) {
            return true
        }
        return false
    }

    public static getType(item: unknown): PossibleParameterTypes | undefined {
        if (item !== undefined && item !== null) {
            if (item instanceof String) {
                return String
            }

            if (item instanceof Number) {
                return Number
            }

            if (item instanceof Boolean) {
                return Boolean
            }
        }
        return undefined
    }

    public static getArrayType(array: Array<unknown>): PossibleParameterTypes | undefined {
        if (array && array.length > 0) {
            for (const item of array) {
                if (item) {
                    return CastUtils.getType(item)
                }
            }
        }
        return undefined
    }

    public static toUnknown(value: unknown, clazz: PossibleParameterTypes | undefined): unknown {
        if (value === undefined && value === null) {
            return undefined
        }

        if (!clazz) {
            return value
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v = value as any

        if (v.constructor === Number) {
            if (clazz === Number) {
                return value
            }

            if (clazz === String) {
                return String(value)
            }

            if (clazz === Boolean) {
                return value !== 0
            }

            return value
        }

        if (v.constructor === String) {
            if (clazz === String) {
                return value
            }

            const s = value as string

            if (clazz === Number) {
                return s.includes('.') ? Number.parseFloat(s) : Number.parseInt(s)
            }

            if (clazz === Boolean) {
                return 'true' === s
            }

            return s
        }

        if (v.constructor === Boolean) {
            if (clazz === Boolean) {
                return value
            }

            const b = value as boolean

            if (clazz === Number) {
                return b ? 1 : 0
            }

            if (clazz === String) {
                return b ? 'true' : 'false'
            }

            return b
        }

        return value
    }

    public static toString(value: unknown, defaultValue?: string): string | undefined {
        if (value !== null && value !== undefined) {
            const v = CastUtils.toUnknown(value, String) as string
            return v === null || v === undefined ? defaultValue : v
        }
        return defaultValue
    }

    public static toNumber(value: unknown, defaultValue?: number): number | undefined {
        if (value !== null && value !== undefined) {
            const v = CastUtils.toUnknown(value, Number) as number
            return v === null || v === undefined ? defaultValue : v
        }
        return defaultValue
    }

    public static toBoolean(value: unknown, defaultValue?: boolean): boolean | undefined {
        if (value) {
            const v = CastUtils.toUnknown(value, Boolean) as boolean
            return v === null || v === undefined ? defaultValue : v
        }
        return defaultValue
    }

}
