import { Observable, observe, Scope } from 'wdc-cube'

@Observable
export class RestrictedScope extends Scope {
    @observe() menu?: Scope | null
    @observe() detail?: Scope | null
}