import _isFunction from 'lodash/isFunction'
import _isObject from 'lodash/isObject'
import { Place, PlaceCreator } from './Place'

export type CubeTree = {
    [key: string]: CubeTree | PlaceCreator
}

export class CubeBuilder {
    public static build(routers: CubeTree) {
        for (const [key, value] of Object.entries(routers)) {
            doBuild(Place.ROOT, '/' + key, value as Record<string, unknown>)
        }
    }
}

function doBuild(parent: Place, path: string, routers: Record<string, unknown>) {
    const placeCreator = routers.presenter as PlaceCreator | undefined
    if (placeCreator && _isFunction(placeCreator)) {
        const place = placeCreator(path, parent)

        for (const [key, value] of Object.entries(routers)) {
            if (key !== 'presenter' && _isObject(value)) {
                doBuild(place, path + '/' + key, value as Record<string, unknown>)
            }
        }
    }
}
