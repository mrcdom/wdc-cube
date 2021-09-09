import { Place } from 'wdc-cube'

import { RootPresenter } from './root/RootPresenter'
import { Module1Presenter } from './module1/Module1Presenter'
import { Module1DetailPresenter } from './module1/Module1DetailPresenter'
import { Module2Presenter } from './module2/Module2Presenter'
import { Module2DetailPresenter } from './module2/Module2DetailPresenter'

export const Places = {

    root: Place.UNKNOWN,
    module1: Place.UNKNOWN,
    module1Detail: Place.UNKNOWN,
    module2: Place.UNKNOWN,
    module2Detail: Place.UNKNOWN,

}

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