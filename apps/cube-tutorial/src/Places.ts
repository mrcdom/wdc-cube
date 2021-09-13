import { Place } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvcPresenter'
import { Module2Presenter } from './modules/subscriptions/Module2Presenter'
import { Module2DetailPresenter } from './modules/subscriptions/Module2DetailPresenter'
import { RestrictedPresenter } from './modules/restricted/RestrictedPresenter'

const root = Place.createDetached('/')

const module1 = Place.create('/m1', TodoMvcPresenter)

const module2 = Place.create('/m2', Module2Presenter)
const module2Detail = Place.create('/m2/detail', Module2DetailPresenter, module2)

const restricted = Place.create('/restricted', RestrictedPresenter)

export const Places = {
    root, module1, module2, module2Detail,
    restricted
}