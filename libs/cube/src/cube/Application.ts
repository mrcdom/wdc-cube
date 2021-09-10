import { Logger } from '../utils/Logger'
import { Comparators } from '../utils/Comparators'
import { CastUtils } from '../utils/CastUtils'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { HistoryManager } from './HistoryManager'
import { NavigationContext } from './NavigationContext'
import type { IPresenter } from './IPresenter'

import type { PresenterMapType } from './Presenter'

const LOG = Logger.get('Application')

export class Application implements IPresenter {

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

    public get fallbackPlace(): Place {
        return this.__rootPlace
    }

    public commitComputedFields(): void {
        try {
            this.computeDerivatedFields()
        } catch (caught) {
            LOG.error(`Processing ${this.constructor.name}.commitComputedState()`, caught)
        }

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

        for (const presenter of this.__presenterMap.values()) {
            presenter.publishParameters(uri)
        }

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

    public async go(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }) {
        const uri = this.newUri(place)

        if (args?.params) {
            for (const [name, value] of Object.entries(args.params)) {
                uri.setParameter(name, value)
            }
        }

        if (args?.attrs) {
            for (const [name, value] of Object.entries(args.attrs)) {
                uri.attributes.set(name, value)
            }
        }

        await this.navigate(uri)
    }

    public async navigate(uri: PlaceUri | string) {
        const defaultPlace = this.__lastPlace ?? this.rootPlace

        if (uri) {
            if (CastUtils.isInstanceOf(uri, String)) {
                const suri = uri as string
                await this.doNavigate(PlaceUri.parse(suri, (name) => {
                    return this.__placeMap.get(name) || defaultPlace
                }))
                return
            }

            if (uri instanceof PlaceUri) {
                await this.doNavigate(uri)
                return
            }
        }

        await this.doNavigate(this.newUri(defaultPlace))
    }

    private async applyPathParameters(context: NavigationContext, atLevel: number) {
        const uri = context.targetUri

        try {
            const ok = await this.applyParameters(uri, false, uri.place.id === -1)
            if (!ok) {
                return
            }
        } catch (caught) {
            if (this.fallbackPlace !== this.rootPlace) {
                LOG.error('Failed navigating just on root presenter. Going to fallback place', caught)
                this.go(this.fallbackPlace)
            } else {
                LOG.error('Failed navigating just on root presenter. Nothing can be done!', caught)
            }
            return
        }

        for (const place of uri.place.path) {
            if (place.id != -1 && !(await context.build(place, atLevel))) {
                break
            }
        }
    }

    protected async doNavigate(uri: PlaceUri) {
        let context = this.__navigationContext
        if (context) {
            context.targetUri = uri
            const level = context.incrementAndGetLevel()
            await this.applyPathParameters(context, level)
        } else {
            context = new NavigationContext(this, uri)
            try {
                this.__navigationContext = context

                await this.applyPathParameters(context, 0)

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
        if (!this.__navigationContext && sender.location) {
            const action = async () => {
                try {
                    await this.navigate(sender.location)
                } catch (caught) {
                    LOG.error(`Invalid history location uri=${sender.location}`, caught)

                    if (this.fallbackPlace !== this.rootPlace) {
                        try {
                            await this.go(this.fallbackPlace)
                        } catch (caught) {
                            LOG.error('Invalid fallback place', caught)
                        }
                    }
                }
            }

            // Run it
            action().catch(() => void 0)
        }
    }

    // :: State Management

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        return true
    }

    public computeDerivatedFields(): void {
        // NOOP
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(uri: PlaceUri): void {
        // NOOP
    }

}