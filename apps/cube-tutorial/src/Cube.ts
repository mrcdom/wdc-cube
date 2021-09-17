import { cube, place } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvc.presenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/detail/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'
import { Places as p } from './Constants'

export const buildCube = () => {
    cube(
        p.todos = place('todos', TodoMvcPresenter),
        p.subscriptions = place('subscriptions', SubscriptionsPresenter,
            p.subscriptionsDetail = place('detail', SubscriptionsDetailPresenter)
        ),
        p.restricted = place('restricted', RestrictedPresenter)
    )    
}