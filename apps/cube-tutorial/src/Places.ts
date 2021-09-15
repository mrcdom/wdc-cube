import { Place } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvc.presenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/detail/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'

const root = Place.createDetached('/')

const todos = Place.create('/todos', TodoMvcPresenter, root)

const subscriptions = Place.create('/subscriptions', SubscriptionsPresenter, root)
const subscriptionsDetail = Place.create('/subscriptions/detail', SubscriptionsDetailPresenter, subscriptions)

const restricted = Place.create('/restricted', RestrictedPresenter, root)

export const Places = {
    root, todos, subscriptions, subscriptionsDetail,
    restricted
}