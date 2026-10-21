import { Application, FlipIntent, ScopeSlot, NOOP_VOID } from 'wdc-cube'
import { Places } from '../RouteConsts'

/** This file's name prefix - unique in the application. */
const PREFIX = 'mn'

/**
 * The composition slots: the one deliberate reuse of a name. Each level of the path
 * takes over visual parenthood and rewrites the SAME entry for the next level to fit
 * where it decides - which is why a presenter reads its slot on every call.
 */
const A = {
    parentSlot: `${PREFIX}-parent-slot`,
    dialogSlot: `${PREFIX}-dialog-slot`
} as const

export class MainKeys {
    protected _intent: FlipIntent
    protected _app: Application

    public allow: boolean

    constructor(app: Application, intent?: FlipIntent) {
        this.allow = true
        this._app = app
        this._intent = intent ? intent : app.newFlipIntent(this.place)
    }

    public get place() {
        return Places.main
    }

    public get targetPlace() {
        return this._intent.place
    }

    public flip(): Promise<void> {
        return this._app.flipToIntent(this._intent)
    }

    // :: Parameters

    // :: parentSlot

    public get parentSlot() {
        return this._intent.getScopeSlot(A.parentSlot) ?? NOOP_VOID
    }

    public set parentSlot(value: ScopeSlot) {
        this._intent.setScopeSlot(A.parentSlot, value)
    }

    // :: parentSlot

    public get dialogSlot() {
        return this._intent.getScopeSlot(A.dialogSlot) ?? NOOP_VOID
    }

    public set dialogSlot(value: ScopeSlot) {
        this._intent.setScopeSlot(A.dialogSlot, value)
    }
}
