import { Logger, Place } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvc.presenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/detail/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'
import { Places as t } from './Constants'

const LOG = Logger.get('Cube')

function group(parent: Place, children: (parent: Place) => void) {
    children(parent)
}

export function buildCube(p = Place.create) {
    // Level 0
    t.todos = p('/todos', TodoMvcPresenter)

    group(t.subscriptions = p('/subscriptions', SubscriptionsPresenter), parent => {
        // Level 1
        t.subscriptionsDetail = p('/subscriptions/detail', SubscriptionsDetailPresenter, parent)
    })

    group(t.restricted = p('/restricted', RestrictedPresenter), parent => {
        // Level 1
        LOG.debug('TODO', parent.id)
    })
}