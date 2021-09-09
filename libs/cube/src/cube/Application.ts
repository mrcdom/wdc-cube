import { Logger } from '../utils/Logger'
import { Comparators } from '../utils/Comparators'
import { CastUtils } from '../utils/CastUtils'
import { Place } from './Place'
import { PlaceUri } from './PlaceUri'
import { HistoryManager } from './HistoryManager'
import { NavigationContext } from './NavigationContext'

import type { PresenterMapType } from './Presenter'

const LOG = Logger.get('Application')

export class Application {

    private __placeMap: Map<string, Place>

    private __presenterMap: PresenterMapType

    private __rootPlace: Place

    private __lastPlace: Place

    private __fragment?: string

    private __historyManager: HistoryManager

    private __navigationContext?: NavigationContext

    public constructor(rootPlace: Place, historyManager: HistoryManager) {
        this.__rootPlace = rootPlace
        this.__lastPlace = rootPlace
        this.__historyManager = historyManager
        this.__presenterMap = new Map()
        this.__placeMap = new Map()

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

    public get rootPlace(): Place {
        return this.__rootPlace
    }

    public get lastPlace(): Place {
        return this.__lastPlace
    }

    public get fragment(): string | undefined {
        return this.__fragment
    }

    public publishParameters(uri: PlaceUri): void {
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

    public newUri(place: Place): PlaceUri {
        const uri = new PlaceUri(place)
        this.publishParameters(uri)
        return uri
    }

    public updateHistory(): void {
        this.historyManager.update(this, this.lastPlace)
    }

    public getPresenter(place: Place) {
        return this.__presenterMap.get(place.id)
    }

    protected catalogPlaces(places: Record<string, Place>) {
        for (const place of Object.values(places)) {
            this.__placeMap.set(place.name, place)
        }
    }

    public async navigate(uri: PlaceUri | string) {
        const defaultPlace = this.__lastPlace ?? this.rootPlace

        if (uri) {
            if (CastUtils.isInstanceOf(uri, String)) {
                const suri = uri as string
                const place = this.__placeMap.get(suri) || defaultPlace
                await this.doNavigate(PlaceUri.parse(suri, () => place))
                return
            }

            if (uri instanceof PlaceUri) {
                await this.doNavigate(uri)
                return
            }
        }

        await this.doNavigate(this.newUri(defaultPlace))
    }

    protected async doNavigate(uri: PlaceUri) {
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
            const context = new NavigationContext(this, uri)
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

    protected onHistoryChanged(sender: HistoryManager) {
        if (!this.__navigationContext) {
            this.navigate(sender.location)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onBeforeNavigation(uri: PlaceUri) {
        // NOOP
    }

}