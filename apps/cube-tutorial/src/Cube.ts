import { Place, CubeBuilder, NOOP_VOID } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvc.presenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/detail/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'
import { Places } from './Constants'

let buildOnce = () => {
    CubeBuilder.build({
        'todos': {
            presenter: Place.creator(TodoMvcPresenter, Places, 'todos'),
        },
        'subscriptions': {
            presenter: Place.creator(SubscriptionsPresenter, Places, 'subscriptions'),

            'detail': {
                presenter: Place.creator(SubscriptionsDetailPresenter, Places, 'subscriptionsDetail'),
            }
        },
        'restricted': {
            presenter: Place.creator(RestrictedPresenter, Places, 'restricted'),
        }
    })

    buildOnce = NOOP_VOID
}

export function buildCube() {
    buildOnce()
    return Places
}