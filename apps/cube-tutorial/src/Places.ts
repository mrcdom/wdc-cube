import { Place } from 'wdc-cube'

import { TodoMvcPresenter } from './modules/todo-mvc/TodoMvcPresenter'
import { SubscriptionsPresenter } from './modules/subscriptions/Subscriptions.presenter'
import { SubscriptionsDetailPresenter } from './modules/subscriptions/SubscriptionsDetail.presenter'
import { RestrictedPresenter } from './modules/restricted/Restricted.presenter'

const root = Place.createDetached('/')

const todos = Place.create('/todos', TodoMvcPresenter)

const subscriptions = Place.create('/subscriptions', SubscriptionsPresenter)
const subscriptionsDetail = Place.create('/subscriptions/detail', SubscriptionsDetailPresenter, subscriptions)

const restricted = Place.create('/restricted', RestrictedPresenter)

export const Places = {
    root, todos, subscriptions, subscriptionsDetail,
    restricted
}