import { CastUtils } from './CastUtils'
import { StandardCharsets } from './StandardCharsets'
import { QueryStringParser } from './QueryStringParser'
import { QueryStringBuilder } from './QueryStringBuilder'
import { WebFlowStep } from './WebFlowStep'
import type { WebFlowScopeSlot } from './WebFlowScopeSlot'

const NOOP_FN = () => {
	// NOOP
}

export class WebFlowPlace extends Object {

	public static parse(placeStr: string): WebFlowPlace {
		// If we have a not blank URI, then we will proceed with URI parsing
		if (placeStr && placeStr.length > 0) {
			// First, we are going to brake the URI into two parts
			const parts = placeStr.split(/\?/)
			const place = new WebFlowPlace(new WebFlowStep(-1, parts[0]))
			if (parts.length > 1) {
				QueryStringParser.parse(place, parts[1], StandardCharsets.UTF_8)
			}
			return place
		} else {
			return new WebFlowPlace(new WebFlowStep(-1, 'unknown'))
		}
	}

	// :: Instance

	private step: WebFlowStep

	private parameters: Map<string, unknown>

	public readonly attributes: Map<string, unknown>

	public constructor(step: WebFlowStep) {
		super()
		this.step = step
		this.parameters = new Map()
		this.attributes = new Map()
	}

	public getStep(): WebFlowStep {
		return this.step
	}

	public setStep(step: WebFlowStep) {
		this.step = step
	}

	public getParameterRawValue(name: string): unknown {
		return this.parameters.get(name)
	}

	/**
	 * <p>
	 * Returns the value of a request parameter, or null if the parameter does not exist.
	 * </p>
	 * <p>
	 * If you use this method with a multivalued parameter, the value returned is equal to the first value in the array.
	 * </p>
	 *
	 * @param name
	 *            a String specifying the name of the parameter
	 * @return a Object representing the value of the parameter
	 */
	public getParameterValue(name: string): unknown {
		const value = this.parameters.get(name)
		if (CastUtils.isArray(value)) {
			return (value as Array<unknown>)[0]
		} else {
			return value
		}
	}

	/**
	 * <p>
	 * Returns the value array of a request parameter, or undefined if the parameter does not exist.
	 * </p>
	 *
	 * @param name
	 *            a String specifying the name of the parameter
	 * @return a Object representing the value of the parameter
	 */
	public getParameterValues(name: string): Array<unknown> {
		const value = this.parameters.get(name)
		if (value === undefined || value === null) {
			return []
		}

		if (CastUtils.isArray(value)) {
			return value as Array<unknown>
		}

		return [value]
	}

	/**
	 * <p>
	 * Returns the value of a request parameter as String, or undefined if the parameter does not exist.
	 * </p>
	 * <p>
	 * You should only use this method when you are sure the parameter has only one value. If the parameter might have more than one value, use
	 * getParameterValues(name: string).
	 * </p>
	 * <p>
	 * If you use this method with a multivalued parameter, the value returned is equal to the first value in the array.
	 * </p>
	 *
	 * @param name
	 *            a String specifying the name of the parameter
	 * @param defaultValue
	 *            a default value to be returned case current value is null
	 * @return a String representing the single value of the parameter
	 */
	public getParameterAsString(name: string, defaultValue?: string): string {
		const value = this.parameters.get(name)
		if (CastUtils.isArray(value)) {
			return CastUtils.toString((value as Array<unknown>)[0], defaultValue) as string
		} else {
			return CastUtils.toString(value, defaultValue) as string
		}
	}

	/**
	 * <p>
	 * Returns the value of a request parameter as a Number, or null if the parameter does not exist.
	 * </p>
	 * <p>
	 * You should only use this method when you are sure the parameter has only one value. If the parameter might have more than one value, use
	 * getParameterValues(name: string).
	 * </p>
	 * <p>
	 * If you use this method with a multivalued parameter, the value returned is equal to the first value in the array.
	 * </p>
	 *
	 * @param name
	 *            a String specifying the name of the parameter
	 * @param defaultValue
	 *            a default value to be returned case current value is null or a invalid conversion
	 * @return a String representing the single value of the parameter
	 */
	public getParameterAsNumber(name: string, defaultValue: number): number {
		const value = this.parameters.get(name)
		if (CastUtils.isArray(value)) {
			return CastUtils.toNumber((value as Array<unknown>)[0], defaultValue) as number
		} else {
			return CastUtils.toNumber(value, defaultValue) as number
		}
	}

	/**
	 * <p>
	 * Returns the value of a request parameter as a Boolean, or null if the parameter does not exist.
	 * </p>
	 * <p>
	 * You should only use this method when you are sure the parameter has only one value. If the parameter might have more than one value, use
	 * getParameterValues(name: string).
	 * </p>
	 * <p>
	 * If you use this method with a multivalued parameter, the value returned is equal to the first value in the array.
	 * </p>
	 *
	 * @param name
	 *            a String specifying the name of the parameter
	 * @param defaultValue
	 *            a default value to be returned case current value is null or a invalid conversion
	 * @return a String representing the single value of the parameter
	 */
	public getParameterAsBoolean(name: string, defaultValue: boolean): boolean {
		const value = this.parameters.get(name)
		if (CastUtils.isArray(value)) {
			return CastUtils.toBoolean((value as Array<unknown>)[0], defaultValue) as boolean
		} else {
			return CastUtils.toBoolean(value, defaultValue) as boolean
		}
	}

	/**
	 * Sets or replace a parameter value. Parameters will became part of the hash token in the history. Be careful and choose short form for names and values.
	 *
	 * @param name
	 *            a String specifying the name of the parameter
	 * @param value
	 *            a a value of this parameter
	 */
	public setParameter(name: string, value?: null | string | number | boolean | string[] | number[] | boolean[]): void {
		if (value === undefined || value === null) {
			this.parameters.delete(name)
		} else {
			this.parameters.set(name, value)
		}
	}

	/**
	 * Returns the query string that is contained in the request path after the path walking.
	 *
	 * @return a String containing the query string.
	 */
	public getQueryString(): string {
		if (this.parameters.size === 0) {
			return ''
		}
		return new QueryStringBuilder().append(this.parameters).toString()
	}

	public override toString(): string {
		const queryString = this.getQueryString()
		if (queryString && queryString.length > 0) {
			return this.step.name + '?' + queryString
		} else {
			return this.step.name
		}
	}

	public setScopeSlot(slotId: string, slot: WebFlowScopeSlot) {
		this.attributes.set(slotId, slot)
	}

	public getScopeSlot(slotId: string): WebFlowScopeSlot {
		const slot = this.attributes.get(slotId)
		if (slot) {
			return slot as WebFlowScopeSlot
		} else {
			return NOOP_FN
		}
	}
}