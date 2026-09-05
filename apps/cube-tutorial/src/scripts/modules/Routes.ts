import { Place, CubeBuilder } from 'wdc-cube'

import { TodoMvcPresenter } from './todo-mvc'
import { SubscriptionsPresenter } from './subscriptions/subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './subscriptions/subscriptions-detail.presenter'
import { RestrictedPresenter } from './restricted/restricted.presenter'
import { Places } from './RouteConsts'

const prepare = CubeBuilder.lazyBuild({
    todos: {
        presenter: Place.creator(TodoMvcPresenter, Places, 'todos')
    },

    subscriptions: {
        presenter: Place.creator(SubscriptionsPresenter, Places, 'subscriptions'),

        detail: {
            presenter: Place.creator(SubscriptionsDetailPresenter, Places, 'subscriptionsDetail')
        }
    },

    restricted: {
        presenter: Place.creator(RestrictedPresenter, Places, 'restricted')
    }
})

export function initialize() {
    prepare()
    return Places
}
