import { Place } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvc.presenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/detail/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'
import { Places as p } from './Constants'

export function buildCube() {
    p.todos = Place.create('/todos', TodoMvcPresenter)

    p.subscriptions = Place.create('/subscriptions', SubscriptionsPresenter)
    {
        p.subscriptionsDetail = Place.create('subscriptions/detail', SubscriptionsDetailPresenter)
    }

    p.restricted = Place.create('/restricted', RestrictedPresenter)
}