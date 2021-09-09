import { CastUtils } from './CastUtils';
export class QueryStringBuilder extends Object {
    constructor() {
        super(...arguments);
        this.query = [];
    }
    appendValue(name, value) {
        const svalue = CastUtils.toString(value, undefined);
        if (svalue && svalue.length > 0) {
            if (this.query.length > 0) {
                this.query.push('&');
            }
            this.query.push(name);
            this.query.push('=');
            this.query.push(encodeURI(svalue.replace(/ /g, '+')));
        }
        return this;
    }
    append(parameters) {
        for (const [name, value] of parameters) {
            if (CastUtils.isArray(value)) {
                const valueArray = value;
                for (const valueItem of valueArray) {
                    this.appendValue(name, valueItem);
                }
            }
            else {
                this.appendValue(name, value);
            }
        }
        return this;
    }
    toString() {
        return this.query.join('');
    }
}
//# sourceMappingURL=QueryStringBuilder.js.map