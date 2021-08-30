import { WFApplication, IPlace } from './webflow'
import { RootPresenter } from './root/RootPresenter'
import { Module1Presenter } from './module1/Module1Presenter'
import { Module1DetailPresenter } from './module1/Module1DetailPresenter'
import { Module2Presenter } from './module2/Module2Presenter'
import { Module2DetailPresenter } from './module2/Module2DetailPresenter'

export class Router {

    public readonly root: IPlace;
    public readonly module1: IPlace;
    public readonly module1Detail: IPlace;
    public readonly module2: IPlace;
    public readonly module2Detail: IPlace;

    public rootPresenter?: RootPresenter

    constructor(app: ApplicationPresenter) {
        this.root = app.newRootPlace(() => this.rootPresenter = new RootPresenter(app, this.root), 'root')
        this.module1 = app.newPlace(this.root, () => new Module1Presenter(app, this.module1), 'module1')
        this.module1Detail = app.newPlace(this.module1, () => new Module1DetailPresenter(app, this.module1Detail), 'module1Detail')
        this.module2 = app.newPlace(this.root, () => new Module2Presenter(app, this.module2), 'module2')
        this.module2Detail = app.newPlace(this.module2, () => new Module2DetailPresenter(app, this.module2Detail), 'module2Detail')
    }

}

export class ApplicationPresenter extends WFApplication {

    public readonly router: Router

    public constructor() {
        super()
        this.router = new Router(this)

        this.go(this.router.root, {})
            .finally(() => this.update())
    }

}