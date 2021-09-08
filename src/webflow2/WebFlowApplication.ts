import Logger from '../utils/logger'
import { Comparators } from './Comparators'
import { CastUtils } from './CastUtils'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowURI } from './WebFlowURI'
import { WebFlowHistoryManager } from './WebFlowHistoryManager'
import { WebFlowNavigationContext } from './WebFlowNavigationContext'

import type { WebFlowPresenterMapType } from './WebFlowPresenter'

const LOG = Logger.get('WebFlowApplication')

export class WebFlowApplication {

    private __placeMap: Map<string, WebFlowPlace>

    private __presenterMap: WebFlowPresenterMapType

    private __lastPlace: WebFlowPlace

    private __fragment?: string

    private __historyManager: WebFlowHistoryManager

    private __navigationContext?: WebFlowNavigationContext

    private __tokenProvider = () => this.newUri(this.__lastPlace).toString()

    public constructor(historyManager: WebFlowHistoryManager) {
        this.__lastPlace = WebFlowPlace.UNKNOWN
        this.__historyManager = historyManager
        this.__presenterMap = new Map()
        this.__placeMap = new Map()
    }

    public release(): void {
        const presenterIds = [] as number[]

        // Collect current presenters IDs
        for (const id of this.__presenterMap.keys()) {
            presenterIds.push(id)
        }

        // Release must be made in reverse order
        presenterIds.sort(Comparators.reverseOrderForNumber)

        // Release all presenters
        for (const presenterId of presenterIds) {
            const presenter = this.__presenterMap.get(presenterId)
            if (presenter) {
                this.__presenterMap.delete(presenterId)
                try {
                    presenter.release()
                } catch (caught) {
                    LOG.error(`Releasing presenter ${presenter.constructor.name}`, caught)
                }
            }
        }

        this.__presenterMap.clear()
    }

    public get historyManager() {
        return this.__historyManager
    }

    public get lastPlace(): WebFlowPlace {
        return this.__lastPlace
    }

    public get fragment(): string | undefined {
        return this.__fragment
    }

    public publishParameters(uri: WebFlowURI): void {
        for (const presenter of this.__presenterMap.values()) {
            presenter.publishParameters(uri)
        }
    }

    public commitComputedFields(): void {
        for (const presenter of this.__presenterMap.values()) {
            try {
                presenter.computeDerivatedFields()
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
        this.historyManager.update(this.__tokenProvider)
    }

    public getPresenter(place: WebFlowPlace) {
        return this.__presenterMap.get(place.id)
    }

    protected catalogPlaces(places: Record<string, WebFlowPlace>) {
        for (const place of Object.values(places)) {
            this.__placeMap.set(place.name, place)
        }
    }

    public async navigate(uri: WebFlowURI | string) {
        if (CastUtils.isInstanceOf(uri, String)) {
            const placeProvider = (name: string) => {
                const place = this.__placeMap.get(name)
                return place ?? WebFlowPlace.createUnbunded(name)
            }

            uri = WebFlowURI.parse(uri as string, placeProvider)
            if (uri.place.id == -1) {
                throw new Error(`No place found under name=${uri.place.name}`)
            }
            await this.doNavigate(uri)
        } else {
            await this.doNavigate(uri as WebFlowURI)
        }
    }

    protected async doNavigate(uri: WebFlowURI) {
        if (this.__navigationContext) {
            const context = this.__navigationContext
            const level = context.incrementAndGetLevel()

            context.targetUri = uri

            for (let i = 0, ilast = uri.place.path.length - 1; i <= ilast; i++) {
                const shouldContinue = await context.build(level, uri.place.path[i], i === ilast)
                if (!shouldContinue || context.level !== level) {
                    break
                }
            }
        } else {
            const context = new WebFlowNavigationContext(this, uri)
            try {
                this.__navigationContext = context

                for (let i = 0, ilast = uri.place.path.length - 1; i <= ilast; i++) {
                    const shouldContinue = await context.build(0, uri.place.path[i], i === ilast)
                    if (!shouldContinue || context.level != 0) {
                        break
                    }
                }

                context.commit(this.__presenterMap)
                this.__lastPlace = context.targetUri.place
                this.commitComputedFields()
            } catch (caught) {
                context.rollback()
                throw caught
            } finally {
                this.__navigationContext = undefined
                this.updateHistory()
            }
        }
    }

}