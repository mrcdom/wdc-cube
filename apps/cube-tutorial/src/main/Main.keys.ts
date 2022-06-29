import { Application, FlipIntent, ScopeSlot, NOOP_VOID } from 'wdc-cube'
import { Places, AttrIds } from '../Constants'

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
        return this._intent.getScopeSlot(AttrIds.parentSlot) ?? NOOP_VOID
    }

    public set parentSlot(value:  ScopeSlot) {
        this._intent.setScopeSlot(AttrIds.parentSlot, value)
    }

    // :: parentSlot

    public get dialogSlot() {
        return this._intent.getScopeSlot(AttrIds.dialogSlot) ?? NOOP_VOID
    }

    public set dialogSlot(value: ScopeSlot) {
        this._intent.setScopeSlot(AttrIds.dialogSlot, value)
    }

}
