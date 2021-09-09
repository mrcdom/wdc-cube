import { Logger } from '../utils/Logger'
import { NOOP_VOID } from './Constants'
import { Scope } from './Scope'
import { HistoryManager } from './HistoryManager'
import { Place } from './Place'
import { PlaceUri } from './PlaceUri'
import { Application } from './Application'

const LOG = Logger.get('ApplicationPresenter')

import type { ScopeSlot } from './ScopeSlot'

export class ApplicationScope extends Scope {
    root?: Scope
}

export abstract class ApplicationPresenter<S extends ApplicationScope> extends Application {

    public readonly scope: S

    protected readonly rootSlot: ScopeSlot = scope => {
        if (this.scope.root !== scope) {
            this.scope.root = scope
            this.scope.update()
        }
    }

    public abstract get parentSlotId(): string
    public abstract get rootPlace(): Place
    public abstract get places(): Record<string, Place>

    public constructor(historyManager: HistoryManager, scope: S) {
        super(historyManager)
        this.scope = scope

    }

    public override release() {
        this.scope.update = NOOP_VOID
        super.release()
        LOG.info('Finalized')
    }

    protected override onBeforeNavigation(uri: PlaceUri) {
        uri.setScopeSlot(this.parentSlotId, this.rootSlot)
    }

    public async initialize() {
        try {
            this.catalogPlaces(this.places)
            await this.navigate(this.historyManager.location, this.rootPlace)
            LOG.info('Initialized')
        } catch (caught) {
            LOG.error('Failed to initialize', caught)
        }
    }

}