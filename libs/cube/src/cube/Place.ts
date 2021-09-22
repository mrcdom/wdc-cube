import { Application } from './Application'

import type { PresenterContructor } from './CubePresenter'

const indexGenMap: Map<number, number> = new Map()

export type PlaceCreator = (path: string, parent: Place) => Place

export class Place {

    public static creator<A extends Application, NAME extends string>(ctor: PresenterContructor<A>, places: Record<NAME, Place>, name: NAME): PlaceCreator {
        return (path, parent) => {
            return places[name] = Place.create(path, ctor, parent)
        }
    }

    public static createDetached(name: string) {
        return new Place(name, undefined, undefined, -1)
    }

    public static create<A extends Application>(name: string, ctor: PresenterContructor<A>, parent?: Place) {
        return new Place(name, parent ?? Place.ROOT, ctor as PresenterContructor<Application>)
    }

    public static UNKNOWN = Place.createDetached('unknown')

    public static ROOT = Place.createDetached('/')

    public readonly id: number

    public readonly pathName: string
    public readonly path: Place[] = []

    public constructor(
        public readonly name: string,
        public readonly parent?: Place,
        public readonly presenterCtor?: PresenterContructor<Application>,
        id?: number,
    ) {
        this.id = typeof id === 'number' ? id : this.nextId()
        if (parent) {
            const pathNameBuilder = [] as string[]
            this.buildPath(pathNameBuilder, this)
            this.pathName = pathNameBuilder.join('/')
        } else {
            this.pathName = name
            this.path.push(this)
        }
    }

    public toString(): string {
        return this.pathName
    }

    private buildPath(pathNameBuilder: string[], step: Place) {
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