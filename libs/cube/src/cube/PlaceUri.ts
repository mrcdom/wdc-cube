import { NOOP_VOID } from './Constants'
import { CastUtils } from '../utils/CastUtils'
import { StandardCharsets } from '../utils/StandardCharsets'
import { QueryStringParser } from '../utils/QueryStringParser'
import { QueryStringBuilder } from '../utils/QueryStringBuilder'
import { Place } from './Place'
import type { ScopeSlot } from './ScopeSlot'

export type ValidParamTypes = string|string[]|number|number[]|boolean|boolean[]|null

export class PlaceUri extends Object {

	public static parse(placeStr: string, stepProvider: (name: string) => Place = Place.createDetached): PlaceUri {
		// If we have a not blank URI, then we will proceed with URI parsing
		if (placeStr && placeStr.length > 0) {
			// First, we are going to brake the URI into two parts
			const parts = placeStr.split(/\?/)
			const step = stepProvider(parts[0])
			const uri = new PlaceUri(step)
			if (parts.length > 1) {
				QueryStringParser.parse(uri.parameters, parts[1], StandardCharsets.UTF_8)
			}
			return uri
		} else {
			return new PlaceUri(Place.UNKNOWN)
		}
	}

	// :: Instance

	public readonly place: Place

	private parameters: Map<string, unknown>

	public readonly attributes: Map<string, unknown>

	public constructor(step: Place) {
		super()
		this.place = step
		this.parameters = new Map()
		this.attributes = new Map()
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
	 * @return a String representing the single value of the parameter
	 */
	public getParameterAsString(name: string): string | undefined {
		const value = this.getParameterValue(name)
		return CastUtils.toString(value)
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
	public getParameterAsStringOrDefault(name: string, defaultValue: string): string {
		const value = this.getParameterValue(name)
		return CastUtils.toString(value, defaultValue) as string
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
	 * @return a String representing the single value of the parameter
	 */
	public getParameterAsNumber(name: string): number | undefined {
		const value = this.getParameterValue(name)
		return CastUtils.toNumber(value)
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
	public getParameterAsNumberOrDefault(name: string, defaultValue: number): number {
		const value = this.getParameterValue(name)
		return CastUtils.toNumber(value, defaultValue) as number
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
	 * @return a String representing the single value of the parameter
	 */
	public getParameterAsBoolean(name: string): boolean | undefined {
		const value = this.getParameterValue(name)
		return CastUtils.toBoolean(value)
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
	public getParameterAsBooleanOrDefault(name: string, defaultValue: boolean): boolean {
		const value = this.getParameterValue(name)
		return CastUtils.toBoolean(value, defaultValue) as boolean
	}

	/**
	 * Sets or replace a parameter value. Parameters will became part of the hash token in the history. Be careful and choose short form for names and values.
	 *
	 * @param name
	 *            a String specifying the name of the parameter
	 * @param value
	 *            a a value of this parameter
	 */
	public setParameter(name: string, value?: ValidParamTypes): void {
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
			return this.place.name + '?' + queryString
		} else {
			return this.place.name
		}
	}

	public setScopeSlot(slotId: string, slot: ScopeSlot) {
		this.attributes.set(slotId, slot)
	}

	public getScopeSlot(slotId: string): ScopeSlot {
		const slot = this.attributes.get(slotId)
		if (slot) {
			return slot as ScopeSlot
		} else {
			return NOOP_VOID
		}
	}
}