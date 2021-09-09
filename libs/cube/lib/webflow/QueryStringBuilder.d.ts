export declare class QueryStringBuilder extends Object {
    private query;
    appendValue(name: string, value: unknown): QueryStringBuilder;
    append(parameters: Map<string, unknown>): QueryStringBuilder;
    toString(): string;
}
