import { Place, CubeBuilder } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvc.presenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/detail/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'
import { Places } from './Constants'

export function buildCube() {
    CubeBuilder.build({
        'todos': {
            presenter: Place.factory(TodoMvcPresenter, Places, 'todos'),
        },
        'subscriptions': {
            presenter: Place.factory(SubscriptionsPresenter, Places, 'subscriptions'),
    
            'detail': {
                presenter: Place.factory(SubscriptionsDetailPresenter, Places, 'subscriptionsDetail'),
            }
        },
        'restricted': {
            presenter: Place.factory(RestrictedPresenter, Places, 'restricted'),
        }
    })
}