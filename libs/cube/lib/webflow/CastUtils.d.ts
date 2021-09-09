export declare type PossibleParameterTypes = NumberConstructor | StringConstructor | BooleanConstructor;
declare type ClassConstructor = new (...args: unknown[]) => unknown;
export declare class CastUtils {
    static isInstanceOf(instance: unknown, ctor: ClassConstructor): boolean;
    static isArray(value: unknown): boolean;
    static getType(item: unknown): PossibleParameterTypes | undefined;
    static getArrayType(array: Array<unknown>): PossibleParameterTypes | undefined;
    static toUnknown(value: unknown, clazz?: PossibleParameterTypes): unknown;
    static toString(value: unknown, defaultValue?: string): string | undefined;
    static toNumber(value: unknown, defaultValue?: number): number | undefined;
    static toBoolean(value: unknown, defaultValue?: boolean): boolean | undefined;
}
export {};
