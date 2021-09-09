import {
    Logger,
    Application,
    HistoryManager,
    Place,
    PlaceUri,
    Scope,
    ScopeSlot,
    NOOP_VOID
} from 'wdc-cube'
import { Places } from './Places'
import { AttrsIds } from './Constants'
import { RootPresenter } from './root/RootPresenter'
import { Module1Presenter } from './module1/Module1Presenter'
import { Module1DetailPresenter } from './module1/Module1DetailPresenter'
import { Module2Presenter } from './module2/Module2Presenter'
import { Module2DetailPresenter } from './module2/Module2DetailPresenter'

const LOG = Logger.get('ApplicationPresenter')

{ // Initialize Places
    const place = Place.create

    // Level 0
    Places.root = place('root', RootPresenter)

    // Level 1
    Places.module1 = place('module1', Module1Presenter, Places.root)
    Places.module2 = place('module2', Module2Presenter, Places.root)

    // Level 2
    Places.module1Detail = place('module1-detail', Module1DetailPresenter, Places.module1)
    Places.module2Detail = place('module2-detail', Module2DetailPresenter, Places.module2)
}

export class ApplicationScope extends Scope {
    root?: Scope
}

export class ApplicationPresenter extends Application {

    public readonly scope = new ApplicationScope('')

    private readonly rootSlot: ScopeSlot = scope => {
        if(this.scope.root !== scope) {
            this.scope.root = scope
            this.scope.update()
        }
    }

    public constructor(historyManager: HistoryManager) {
        super(historyManager)
        this.catalogPlaces(Places)
    }

    public override release() {
        this.scope.update = NOOP_VOID
        super.release()
        LOG.info('Finalized')
    }

    protected override onBeforeNavigation(uri: PlaceUri) {
        uri.setScopeSlot(AttrsIds.parentSlot, this.rootSlot)
    }

    public async initialize() {
        try {
            await this.navigate(this.historyManager.location, Places.root)
            LOG.info('Initialized')
        } catch(caught) {
            LOG.error('Failed to initialize', caught)
        }
    }

}