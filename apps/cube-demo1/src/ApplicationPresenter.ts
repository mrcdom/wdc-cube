import {
    ApplicationPresenter as CubeApplicationPresenter,
    ApplicationScope as CubeApplicationScope,
    HistoryManager,
    Place
} from 'wdc-cube'
import { Places } from './Places'
import { AttrsIds } from './Constants'

export class ApplicationScope extends CubeApplicationScope {

}

export class ApplicationPresenter extends CubeApplicationPresenter<ApplicationScope> {

    public constructor(historyManager: HistoryManager) {
        super(historyManager, new ApplicationScope(''))
    }

    public get parentSlotId(): string {
        return AttrsIds.parentSlot
    }

    public get rootPlace(): Place {
        return Places.root
    }

    public get places(): Record<string, Place> {
        return Places
    }

}