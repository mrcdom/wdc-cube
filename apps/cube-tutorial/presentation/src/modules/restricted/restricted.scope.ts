import { Observable, observe, Scope } from 'wdc-cube'

@Observable
export class RestrictedScope extends Scope {
    /** Filled by the slot this presenter hands to a deeper place. */
    @observe() detail?: Scope | null
}
