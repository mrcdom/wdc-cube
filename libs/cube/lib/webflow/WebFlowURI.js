import { NOOP_VOID } from './Constants';
import { CastUtils } from './CastUtils';
import { StandardCharsets } from './StandardCharsets';
import { QueryStringParser } from './QueryStringParser';
import { QueryStringBuilder } from './QueryStringBuilder';
import { WebFlowPlace } from './WebFlowPlace';
export class WebFlowURI extends Object {
    constructor(step) {
        super();
        this.place = step;
        this.parameters = new Map();
        this.attributes = new Map();
    }
    static parse(placeStr, stepProvider = WebFlowPlace.createUnbunded) {
        if (placeStr && placeStr.length > 0) {
            const parts = placeStr.split(/\?/);
            const step = stepProvider(parts[0]);
            const uri = new WebFlowURI(step);
            if (parts.length > 1) {
                QueryStringParser.parse(uri, parts[1], StandardCharsets.UTF_8);
            }
            return uri;
        }
        else {
            return new WebFlowURI(WebFlowPlace.UNKNOWN);
        }
    }
    getParameterRawValue(name) {
        return this.parameters.get(name);
    }
    getParameterValue(name) {
        const value = this.parameters.get(name);
        if (CastUtils.isArray(value)) {
            return value[0];
        }
        else {
            return value;
        }
    }
    getParameterValues(name) {
        const value = this.parameters.get(name);
        if (value === undefined || value === null) {
            return [];
        }
        if (CastUtils.isArray(value)) {
            return value;
        }
        return [value];
    }
    getParameterAsString(name) {
        const value = this.getParameterValue(name);
        return CastUtils.toString(value);
    }
    getParameterAsStringOrDefault(name, defaultValue) {
        const value = this.getParameterValue(name);
        return CastUtils.toString(value, defaultValue);
    }
    getParameterAsNumber(name) {
        const value = this.getParameterValue(name);
        return CastUtils.toNumber(value);
    }
    getParameterAsNumberOrDefault(name, defaultValue) {
        const value = this.getParameterValue(name);
        return CastUtils.toNumber(value, defaultValue);
    }
    getParameterAsBoolean(name) {
        const value = this.getParameterValue(name);
        return CastUtils.toBoolean(value);
    }
    getParameterAsBooleanOrDefault(name, defaultValue) {
        const value = this.getParameterValue(name);
        return CastUtils.toBoolean(value, defaultValue);
    }
    setParameter(name, value) {
        if (value === undefined || value === null) {
            this.parameters.delete(name);
        }
        else {
            this.parameters.set(name, value);
        }
    }
    getQueryString() {
        if (this.parameters.size === 0) {
            return '';
        }
        return new QueryStringBuilder().append(this.parameters).toString();
    }
    toString() {
        const queryString = this.getQueryString();
        if (queryString && queryString.length > 0) {
            return this.place.name + '?' + queryString;
        }
        else {
            return this.place.name;
        }
    }
    setScopeSlot(slotId, slot) {
        this.attributes.set(slotId, slot);
    }
    getScopeSlot(slotId) {
        const slot = this.attributes.get(slotId);
        if (slot) {
            return slot;
        }
        else {
            return NOOP_VOID;
        }
    }
}
//# sourceMappingURL=WebFlowURI.js.map