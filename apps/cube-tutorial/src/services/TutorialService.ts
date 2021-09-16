import { Logger } from 'wdc-cube'
import type { ServiceLike } from './ServiceLike'

const LOG = Logger.get('TutorialService')

const siteArray = [
    { id: 1, site: 'youtube.com' },
    { id: 2, site: 'twitter.com' },
    { id: 3, site: 'gettr.com' },
]

const subscriptionMap: Map<number, Map<string, boolean>> = new Map()

export type SiteItemType = {
    id: number
    site: string
}

export type TodoType = {
    uid: number
    text: string
    complete: boolean
}

export class TutorialService implements ServiceLike {

    public static readonly INSTANCE = new TutorialService()

    // :: Instance

    private __initialized = false

    public get initialized(): boolean {
        return this.__initialized
    }

    public async postConstruct() {
        this.__initialized = true
    }

    public async preDestroy() {
        this.__initialized = false
    }

    // :: API

    public async fetchSubscribleSites(): Promise<{ id: number; site: string }[]> {
        return siteArray.map(item => Object.assign({}, item))
    }

    public async fetchSiteItem(paramSiteId: number): Promise<SiteItemType | undefined> {
        const item = siteArray.filter(item => item.id === paramSiteId)[0]
        if (item) {
            return Object.assign({}, item)
        }
        throw new Error(`No item found under id=${paramSiteId}`)
    }

    public async updateOrAddSiteSubscription(siteId: number, email: string): Promise<void> {
        let subscriberMap = subscriptionMap.get(siteId)
        if (!subscriberMap) {
            subscriberMap = new Map()
            subscriptionMap.set(siteId, subscriberMap)
        }
        subscriberMap.set(email, true)

        LOG.info('updateOrAddSiteSubscription: ', subscriberMap)
    }

    public async fetchTodos(quantity = 0): Promise<TodoType[]> {
        if (quantity > 0) {
            const todos = [] as TodoType[]
            for (let i = 0; i < 1000; i++) {
                todos.push({
                    uid: i + 1,
                    text: 'Item ' + i,
                    complete: i % 2 === 0,
                })
            }
            return todos
        } else {

            return [
                {
                    uid: 1,
                    text: 'Walk the dog',
                    complete: false,
                },
                {
                    uid: 2,
                    text: 'Write an app',
                    complete: true,
                },
                {
                    uid: 3,
                    text: 'Go to school',
                    complete: false,
                },
                {
                    uid: 4,
                    text: 'Watch Michael Reeves',
                    complete: true,
                },
                {
                    uid: 5,
                    text: 'Add automatic deployment',
                    complete: true,
                }
            ]
        }
    }

}