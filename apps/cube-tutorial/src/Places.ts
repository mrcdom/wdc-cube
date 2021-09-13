import { Place } from 'wdc-cube'

import { TodoMvcPresenter } from './module1/TodoMvcPresenter'
import { Module2Presenter } from './module2/Module2Presenter'
import { Module2DetailPresenter } from './module2/Module2DetailPresenter'
import { RestrictedPresenter } from './restricted/RestrictedPresenter'

const root = Place.createDetached('/')

const module1 = Place.create('/m1', TodoMvcPresenter)

const module2 = Place.create('/m2', Module2Presenter)
const module2Detail = Place.create('/m2/detail', Module2DetailPresenter, module2)

const restricted = Place.create('/restricted', RestrictedPresenter)

export const Places = {
    root, module1, module2, module2Detail,
    restricted
}