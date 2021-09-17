import { Place } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvc.presenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/detail/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'
import { Places as t } from './Constants'

const p = Place.create

export function buildCube() {
    t.todos = p('/todos', TodoMvcPresenter)

    t.subscriptions = p('/subscriptions', SubscriptionsPresenter)
    {
        t.subscriptionsDetail = p('/subscriptions/detail', SubscriptionsDetailPresenter)
    }

    t.restricted = p('/restricted', RestrictedPresenter)
}