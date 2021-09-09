import { ApplicationPresenter, ApplicationScope, HistoryManager, Place } from 'wdc-cube'
import { Places } from './Places'
import { AttrsIds } from './Constants'

export class MainScope extends ApplicationScope {

}

export class MainPresenter extends ApplicationPresenter<MainScope> {

    public constructor(historyManager: HistoryManager) {
        super(Places.root, historyManager, new MainScope(''))
    }

    public get parentSlotId(): string {
        return AttrsIds.parentSlot
    }

    public get places(): Record<string, Place> {
        return Places
    }

}