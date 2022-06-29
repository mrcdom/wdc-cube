import { ReflectionUtils } from './ReflectionUtils'

export class QueryStringBuilder extends Object {
    private query: Array<string> = []

    public appendValue(name: string, value: unknown): QueryStringBuilder {
        const svalue = ReflectionUtils.toString(value, undefined)
        if (svalue && svalue.length > 0) {
            if (this.query.length > 0) {
                this.query.push('&')
            }
            this.query.push(name)
            this.query.push('=')
            this.query.push(encodeURI(svalue.replace(/ /g, '+')))
        }
        return this
    }

    public append(parameters: Map<string, unknown>): QueryStringBuilder {
        for (const [name, value] of parameters) {
            if (ReflectionUtils.isArray(value)) {
                const valueArray = value as Array<unknown>
                for (const valueItem of valueArray) {
                    this.appendValue(name, valueItem)
                }
            } else {
                this.appendValue(name, value)
            }
        }
        return this
    }

    public override toString(): string {
        return this.query.join('')
    }
}
