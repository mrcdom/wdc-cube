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

    public constructor(historyManager: WebFlowHistoryManager) {
        this.__lastPlace = WebFlowPlace.UNKNOWN
        this.__historyManager = historyManager
        this.__presenterMap = new Map()
        this.__placeMap = new Map()

        historyManager.tokenProvider = () => this.newUri(this.__lastPlace).toString()
        historyManager.onChangeListener = this.onHistoryChanged.bind(this)
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
        this.historyManager.update()
    }

    public getPresenter(place: WebFlowPlace) {
        return this.__presenterMap.get(place.id)
    }

    protected catalogPlaces(places: Record<string, WebFlowPlace>) {
        for (const place of Object.values(places)) {
            this.__placeMap.set(place.name, place)
        }
    }

    public async navigate(uri: WebFlowURI | string, fallbackPlace: WebFlowPlace = WebFlowPlace.UNKNOWN) {
        if (CastUtils.isInstanceOf(uri, String)) {
            let suri = uri as string
            if (!suri) {
                suri = fallbackPlace.name
            }

            const placeProvider = (name: string) => {
                const place = this.__placeMap.get(name)
                return place ?? WebFlowPlace.createUnbunded(name)
            }

            uri = WebFlowURI.parse(suri, placeProvider)
            if (uri.place.id == -1) {
                throw new Error(`No place found under name=${uri.place.name}`)
            }
            await this.doNavigate(uri)
        } else {
            await this.doNavigate(uri as WebFlowURI)
        }
    }

    protected async doNavigate(uri: WebFlowURI) {
        this.onBeforeNavigation(uri)

        if (this.__navigationContext) {
            const context = this.__navigationContext
            const level = context.incrementAndGetLevel()

            context.targetUri = uri


            for (const place of uri.place.path) {
                if (!(await context.build(place, level))) {
                    break
                }
            }
        } else {
            const context = new WebFlowNavigationContext(this, uri)
            try {
                this.__navigationContext = context

                for (const place of uri.place.path) {
                    if (!(await context.build(place, 0))) {
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

    protected onHistoryChanged(sender: WebFlowHistoryManager) {
        if (!this.__navigationContext) {
            this.navigate(sender.location, this.lastPlace)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onBeforeNavigation(uri: WebFlowURI) {
        // NOOP
    }

}