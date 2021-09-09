import { Place } from 'wdc-cube'

import { RootPresenter } from './root/RootPresenter'
import { Module1Presenter } from './module1/Module1Presenter'
import { Module1DetailPresenter } from './module1/Module1DetailPresenter'
import { Module2Presenter } from './module2/Module2Presenter'
import { Module2DetailPresenter } from './module2/Module2DetailPresenter'

// Level 0
const root = Place.create('/', RootPresenter)

// Level 1
const module1 = Place.create('/m1', Module1Presenter, root)
const module2 = Place.create('/m2', Module2Presenter, root)

// Level 2
const module1Detail = Place.create('/m1/detail', Module1DetailPresenter, module1)
const module2Detail = Place.create('/m2/detail', Module2DetailPresenter, module2)

export const Places = {
    root, module1, module2, module1Detail, module2Detail
}