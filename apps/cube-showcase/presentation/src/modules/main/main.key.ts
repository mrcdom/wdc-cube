import { Application, FlipIntent, NOOP_VOID, ScopeSlot } from 'wdc-cube'

import { AttrIds, Places } from '../RouteConsts'

/**
 * The base every other module's keys extend.
 *
 * A "keys" class is the typed face of an intent: it says which parameters a
 * place understands, and it is the only place that knows their names. A
 * presenter reads and writes them through it and never touches the URL.
 */
export class MainKeys {
    protected _intent: FlipIntent
    protected _app: Application

    public constructor(app: Application, intent?: FlipIntent) {
        this._app = app
        this._intent = intent ?? app.newFlipIntent(this.place)
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

    public toString(): string {
        return this._intent.toString()
    }

    // :: Slots

    public get parentSlot() {
        return this._intent.getScopeSlot(AttrIds.parentSlot) ?? NOOP_VOID
    }

    public set parentSlot(value: ScopeSlot) {
        this._intent.setScopeSlot(AttrIds.parentSlot, value)
    }

    public get dialogSlot() {
        return this._intent.getScopeSlot(AttrIds.dialogSlot) ?? NOOP_VOID
    }

    public set dialogSlot(value: ScopeSlot) {
        this._intent.setScopeSlot(AttrIds.dialogSlot, value)
    }
}
