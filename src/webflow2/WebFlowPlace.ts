import { WebFlowApplication } from './WebFlowApplication'
import { WebFlowPresenter } from './WebFlowPresenter'
import { WebFlowScope } from './WebFlowScope'

const indexGenMap: Map<number, number> = new Map()

type PresenterType = WebFlowPresenter<WebFlowApplication, WebFlowScope>
type PresenterContructor<A extends WebFlowApplication> = { new(app: A): PresenterType }
export type PresenterFactory = (app: WebFlowApplication) => PresenterType

function newPresenterFactory<A extends WebFlowApplication>(ctor: PresenterContructor<A>): PresenterFactory {
    return (app) => {
        return new ctor((app as unknown) as A)
    }
}

const noPresenterFactory: PresenterFactory = () => {
    throw new Error('No presenter factory was provided')
}

export class WebFlowPlace {

    public static createUnbunded(name: string) {
        return new WebFlowPlace(name, undefined, () => {
            throw new Error('Unbounded place can not create a presenter')
        }, -1)
    }

    public static UNKNOWN = WebFlowPlace.createUnbunded('unknown')

    public static create<A extends WebFlowApplication>(name: string, ctor: PresenterContructor<A>, parent?: WebFlowPlace) {
        return new WebFlowPlace(name, parent, newPresenterFactory(ctor))
    }

    public readonly id: number

    public readonly path: WebFlowPlace[] = []

    public constructor(
        public readonly name: string,
        public readonly parent?: WebFlowPlace,
        public readonly factory: PresenterFactory = noPresenterFactory,
        id?: number
    ) {
        this.buildPath(this)
        this.id = typeof id === 'number' ? id : this.nextId()
    }

    private buildPath(step: WebFlowPlace) {
        if (step.parent) {
            this.buildPath(step.parent)
        }

        if (step && step.id != -1) {
            this.path.push(step)
        }
    }

    private nextId() {
        let idxLevelGen = indexGenMap.get(this.path.length)
        if (idxLevelGen === undefined) {
            idxLevelGen = this.path.length * 1000
        } else {
            idxLevelGen++
        }
        indexGenMap.set(this.path.length, idxLevelGen)
        return idxLevelGen
    }

}