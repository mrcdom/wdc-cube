/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { isFunction, isObject } from './utils/TypeGuards'
import { Place, PlaceCreator } from './Place'
import { NOOP_VOID } from './utils/EmptyFunctions'

export type CubeTree = {
    [key: string]: CubeTree | PlaceCreator
}

export class CubeBuilder {
    public static build(routers: CubeTree) {
        for (const [key, value] of Object.entries(routers)) {
            doBuild(Place.ROOT, '/' + key, value as Record<string, unknown>)
        }
    }

    public static lazyBuild(routers: CubeTree) {
        let prepare = () => {
            CubeBuilder.build(routers)
        }
        return () => {
            prepare()
            prepare = NOOP_VOID
        }
    }
}

function doBuild(parent: Place, path: string, routers: Record<string, unknown>) {
    const placeCreator = routers.presenter as PlaceCreator | undefined
    if (placeCreator && isFunction(placeCreator)) {
        const place = placeCreator(path, parent)

        for (const [key, value] of Object.entries(routers)) {
            if (key !== 'presenter' && isObject(value)) {
                doBuild(place, path + '/' + key, value as Record<string, unknown>)
            }
        }
    }
}
