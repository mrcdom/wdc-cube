import { Application } from './Application'
import { Place } from './Place'
import { PresenterContructor } from './Presenter'

const CubeContext = {
    parentId: '/'
}

export function cube(...places: Place[]): Place[] {
    return places
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function place<A extends Application>(name: string, ctor: PresenterContructor<A>, ...places: Place[]) {
    const placeId = CubeContext.parentId + name
    const result = Place.create(placeId, ctor)
    CubeContext.parentId = placeId + '/'
    return result
}