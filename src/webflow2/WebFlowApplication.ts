import Logger from '../utils/logger'
import { Comparators } from './Comparators'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowURI } from './WebFlowURI'
import { WebFlowPresenter } from './WebFlowPresenter'
import { WebFlowHistoryManager } from './WebFlowHistoryManager'
import type { WebFlowScope } from './WebFlowScope'
import { CastUtils } from './CastUtils'

const LOG = Logger.get('WebFlowApplication')

type PresenterType = WebFlowPresenter<WebFlowApplication, WebFlowScope>
type PresenterMapType = Map<number, PresenterType>
type PresenterNode = {
    place: WebFlowPlace
    instance: PresenterType
}

let CURRENT_NAVIGATION_CONTEXT: NavigationContext | undefined = undefined

export class NavigationContext {

    private app: WebFlowApplication

    private curPresenterMap: PresenterMapType
    private newPresenterMap: PresenterMapType
    private sourceUri: WebFlowURI
    private targetUri: WebFlowURI
    private overlappedLevel: number
    private path: PresenterNode[]

    public constructor(app: WebFlowApplication, targetUri: WebFlowURI) {
        this.app = app
        this.targetUri = targetUri

        if (CURRENT_NAVIGATION_CONTEXT) {
            this.sourceUri = CURRENT_NAVIGATION_CONTEXT.sourceUri
            this.newPresenterMap = CURRENT_NAVIGATION_CONTEXT.newPresenterMap
            this.curPresenterMap = CURRENT_NAVIGATION_CONTEXT.curPresenterMap
            this.overlappedLevel = CURRENT_NAVIGATION_CONTEXT.overlappedLevel + 1
            this.path = CURRENT_NAVIGATION_CONTEXT.path
            this.path.length = 0
        } else {
            this.overlappedLevel = 0
            this.sourceUri = app.newUri(app.lastPlace)
            this.path = []
            this.newPresenterMap = new Map()
            this.curPresenterMap = this.app.__exportPresenters()
        }

        CURRENT_NAVIGATION_CONTEXT = this
    }

    public async build(place: WebFlowPlace, deepest: boolean) {
        // Only runs if this context is the last context
        if (this !== CURRENT_NAVIGATION_CONTEXT) {
            return
        }

        let result: boolean

        const presenter = this.curPresenterMap.get(place.id)
        if (presenter) {
            this.path.push({ place: place, instance: presenter })
            this.newPresenterMap.set(place.id, presenter)
            result = await presenter.applyParameters(this.targetUri, false, deepest)
        } else {
            const presenter = place.factory(this.app)
            this.newPresenterMap.set(place.id, presenter)
            this.path.push({ place: place, instance: presenter })
            result = await presenter.applyParameters(this.targetUri, true, deepest)
        }

        return result
    }

    public rollback(): void {
        if (this.overlappedLevel === 0) {
            try {
                const presenterIds = [] as number[]

                // Collect current presenters IDs
                for (const id of this.curPresenterMap.keys()) {
                    presenterIds.push(id)
                }

                // Sort according to ID to preserve composition order
                presenterIds.sort(Comparators.naturalOrderForNumber)

                for (let i = 0, iLast = presenterIds.length - 1; i <= iLast; i++) {
                    const presenterId = presenterIds[i]
                    try {
                        this.newPresenterMap.delete(presenterId)

                        const presenter = this.curPresenterMap.get(presenterId)
                        if (presenter != null) {
                            presenter.applyParameters(this.sourceUri, false, i == iLast)
                        } else {
                            LOG.warn(`Missing presenter for ID=${presenterId}`)
                        }
                    } catch (caught) {
                        LOG.error('Restoring source state', caught)
                    }
                }

                if (this.newPresenterMap.size > 0) {
                    this.releasePresenters(this.newPresenterMap)
                    this.newPresenterMap.clear()
                }
            } finally {
                CURRENT_NAVIGATION_CONTEXT = undefined
                this.app.commitComputedFields()
                this.app.updateHistory()
            }
        }
    }

    public commit(): void {
        if (this.overlappedLevel === 0) {
            try {
                const validPresenterMap = new Map() as PresenterMapType
                // Only presenters of last valid path must be kept
                for (const node of this.path) {
                    const presenter = this.newPresenterMap.get(node.place.id)
                    if (presenter) {
                        validPresenterMap.set(node.place.id, presenter)
                    }
                }

                // Remove presenters that will be kept
                for (const presenterId of validPresenterMap.keys()) {
                    this.curPresenterMap.delete(presenterId)
                }

                // Remove presenters that will be kept
                for (const presenterId of this.newPresenterMap.keys()) {
                    this.newPresenterMap.delete(presenterId)
                }

                // Non participating paresenter on new state must be released
                if (this.curPresenterMap.size > 0) {
                    this.releasePresenters(this.curPresenterMap)
                }

                if (this.newPresenterMap.size > 0) {
                    this.releasePresenters(this.newPresenterMap)
                }
            } finally {
                CURRENT_NAVIGATION_CONTEXT = undefined
                this.app.__commit(this.path)
                this.app.commitComputedFields()
                this.app.updateHistory()
            }
        }
    }

    private releasePresenters(presenterInstanceMap: PresenterMapType): void {
        const presenterIds = [] as number[]

        for (const presenterId of presenterInstanceMap.keys()) {
            presenterIds.push(presenterId)
        }

        // release on reverse order (deepest level first)
        presenterIds.sort(Comparators.reverseOrderForNumber)

        for (const presenterId of presenterIds) {
            const presenter = presenterInstanceMap.get(presenterId)
            if (presenter != null) {
                try {
                    presenterInstanceMap.delete(presenterId)
                    presenter.release()
                } catch (caught) {
                    LOG.error('Releasing presenter', caught)
                }
            }
        }
    }

}

export class WebFlowApplication {

    protected placeMap: Map<string, WebFlowPlace>

    protected presenterMap: PresenterMapType

    protected path: PresenterNode[]

    protected _fragment?: string

    protected _historyManager: WebFlowHistoryManager

    private placeProvider = (name: string) => {
        const place = this.placeMap.get(name)
        return place ?? WebFlowPlace.createUnbunded(name)
    }

    public constructor() {
        this.path = []
        this._historyManager = WebFlowHistoryManager.NOOP
        this.presenterMap = new Map()
        this.placeMap = new Map()
    }

    public release(): void {
        const presenterIds = [] as number[]

        // Collect current presenters IDs
        for (const id of this.presenterMap.keys()) {
            presenterIds.push(id)
        }

        // Release must be made in reverse order
        presenterIds.sort(Comparators.reverseOrderForNumber)

        // Release all presenters
        for (const presenterId of presenterIds) {
            const presenter = this.presenterMap.get(presenterId)
            if (presenter) {
                this.presenterMap.delete(presenterId)
                try {
                    presenter.release()
                } catch (caught) {
                    LOG.error(`Releasing presenter ${presenter.constructor.name}`, caught)
                }
            }
        }

        this.presenterMap.clear()
    }

    public get historyManager() {
        return this._historyManager
    }

    public get lastPlace(): WebFlowPlace {
        if (this.path.length > 0) {
            const presenter = this.path[this.path.length - 1]
            return presenter.place
        } else {
            return WebFlowPlace.UNKNOWN
        }
    }

    public get fragment(): string | undefined {
        return this._fragment
    }

    public publishParameters(uri: WebFlowURI): void {
        for (const presenter of this.presenterMap.values()) {
            presenter.publishParameters(uri)
        }
    }

    public commitComputedFields(): void {
        for (const presenter of this.presenterMap.values()) {
            try {
                presenter.commitComputedFields()
            } catch (caught) {
                LOG.error(`Processing ${presenter.constructor.name}.commitComputedState()`, caught)
            }
        }
    }

    public newUri(place: WebFlowPlace): WebFlowURI {
        const uri = new WebFlowURI(place)
        this.publishParameters(uri)
        return uri
    }

    public updateHistory(): void {
        this.historyManager.update()
    }

    public __commit(path: PresenterNode[]) {
        this.presenterMap.clear()
        this.path = path
        for (const node of path) {
            this.presenterMap.set(node.place.id, node.instance)
        }
    }

    public __exportPresenters(): PresenterMapType {
        const result = new Map() as PresenterMapType
        for (const [id, presenter] of this.presenterMap) {
            result.set(id, presenter)
        }
        return result
    }

    public getPresenter(place: WebFlowPlace) {
        return this.presenterMap.get(place.id)
    }

    public catalogPlaces(places: Record<string, WebFlowPlace>) {
        for (const place of Object.values(places)) {
            this.placeMap.set(place.name, place)
        }
    }

    public async navigate(uri: WebFlowURI | string) {
        if (CastUtils.isInstanceOf(uri, String)) {
            uri = WebFlowURI.parse(uri as string, this.placeProvider)
            if (uri.place.id == -1) {
                throw new Error(`No place found under name=${uri.place.name}`)
            }
            await this.doNavigate(uri)
        } else {
            await this.doNavigate(uri as WebFlowURI)
        }
    }

    protected async doNavigate(uri: WebFlowURI) {
        const context = new NavigationContext(this, uri)
        try {
            for (let i = 0, ilast = uri.place.path.length - 1; i <= ilast; i++) {
                await context.build(uri.place.path[i], i === ilast)
            }

            context.commit()
        } catch (caught) {
            context.rollback()
            throw caught
        }
    }

}