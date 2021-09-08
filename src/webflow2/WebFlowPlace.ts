import { WebFlowApplication, } from './WebFlowApplication'
import { newPresenterFactory } from './WebFlowPresenter'

import type { WebFlowPresenterContructor, WebFlowPresenterFactory } from './WebFlowPresenter'

const indexGenMap: Map<number, number> = new Map()

const noPresenterFactory: WebFlowPresenterFactory = () => {
    throw new Error('No presenter factory was provided')
}

export class WebFlowPlace {

    public static createUnbunded(name: string) {
        return new WebFlowPlace(name, undefined, () => {
            throw new Error('Unbounded place can not create a presenter')
        }, -1)
    }

    public static UNKNOWN = WebFlowPlace.createUnbunded('unknown')

    public static create<A extends WebFlowApplication>(name: string, ctor: WebFlowPresenterContructor<A>, parent?: WebFlowPlace) {
        return new WebFlowPlace(name, parent, newPresenterFactory(ctor))
    }

    public readonly id: number

    public readonly pathName: string
    public readonly path: WebFlowPlace[] = []

    public constructor(
        public readonly name: string,
        public readonly parent?: WebFlowPlace,
        public readonly factory: WebFlowPresenterFactory = noPresenterFactory,
        id?: number
    ) {
        const pathNameBuilder = [] as string[]
        this.buildPath(pathNameBuilder, this)
        this.id = typeof id === 'number' ? id : this.nextId()
        this.pathName = pathNameBuilder.join('/')
    }

    public toString(): string {
        return this.pathName
    }

    private buildPath(pathNameBuilder: string[], step: WebFlowPlace) {
        if (step.parent) {
            this.buildPath(pathNameBuilder, step.parent)
        }

        if (step && step.id != -1) {
            pathNameBuilder.push(step.name)
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