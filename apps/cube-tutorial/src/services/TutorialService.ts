import { Logger, ServiceLike } from 'wdc-cube'

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
    id: number
    title: string
    completed: boolean
}

export class TutorialService implements ServiceLike {

    public static readonly INSTANCE = new TutorialService()

    // :: Instance

    private __initialized = false

    public get name() {
        return 'tutorial-service'
    }

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

    public async fetchTodos(userId: number): Promise<TodoType[]> {
        if (userId < 0) {
            const todos = [] as TodoType[]
            for (let i = 0; i < 1000; i++) {
                todos.push({
                    id: i + 1,
                    title: 'Item ' + i,
                    completed: i % 2 === 0,
                })
            }
            return todos
        }
        // Local mock data
        else if (userId === 0) {
            return [
                {
                    id: 1,
                    title: 'Walk the dog',
                    completed: false,
                },
                {
                    id: 2,
                    title: 'Write an app',
                    completed: true,
                },
                {
                    id: 3,
                    title: 'Go to school',
                    completed: false,
                },
                {
                    id: 4,
                    title: 'Watch Michael Reeves',
                    completed: true,
                },
                {
                    id: 5,
                    title: 'Add automatic deployment',
                    completed: true,
                }
            ]
        } else {
            const data = await fetch(`https://jsonplaceholder.typicode.com/todos?userId=${userId}`)
                .then(response => response.json()) as TodoType[]

            return data
        }
    }

}