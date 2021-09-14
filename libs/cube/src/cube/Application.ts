import { Logger } from '../utils/Logger'
import { Comparators } from '../utils/Comparators'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { HistoryManager } from './HistoryManager'
import { NavigationContext } from './NavigationContext'

import type { PresenterMapType } from './Presenter'

const LOG = Logger.get('Application')

export type AlertSeverity = 'error' | 'success' | 'info' | 'warning'

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

    public get fallbackPlace(): Place {
        return this.__rootPlace
    }


    public emitAllBeforeScopeUpdate(): void {
        for (const presenter of this.__presenterMap.values()) {
            presenter.emitBeforeScopeUpdate()
        }
    }

    protected publishAllParameters(uri: PlaceUri) {
        for (const presenter of this.__presenterMap.values()) {
            presenter.publishParameters(uri)
        }
    }

    public newUri(place: Place): PlaceUri {
        const uri = new PlaceUri(place)
        this.publishAllParameters(uri)
        return uri
    }

    public newUriFromString(suri: string): PlaceUri {
        const defaultPlace = this.__lastPlace ?? this.rootPlace
        if (suri) {
            const uri = PlaceUri.parse(suri, name => this.__placeMap.get(name) || defaultPlace)
            return uri
        } else {
            return new PlaceUri(defaultPlace)
        }
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

    public async flip(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }) {
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

        await this.doFlipToNewPlace(uri)
    }

    public async flipToUriString(suri: string) {
        await this.doFlipToNewPlace(this.newUriFromString(suri))
    }

    public async flipToUri(uri: PlaceUri) {
        if (uri) {
            await this.doFlipToNewPlace(uri)
        } else {
            const defaultPlace = this.__lastPlace ?? this.rootPlace
            await this.doFlipToNewPlace(this.newUri(defaultPlace))
        }
    }

    protected async doFlipToNewPlace(uri: PlaceUri) {
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

                this.emitAllBeforeScopeUpdate()
            } catch (caught) {
                context.rollback()
                throw caught
            } finally {
                this.__navigationContext = undefined
                this.updateHistory()
            }
        }
    }

    protected async applyPathParameters(context: NavigationContext, atLevel: number) {
        const uri = context.targetUri

        for (const place of uri.place.path) {
            if (place.id != -1 && !(await context.step(place, atLevel))) {
                break
            }
        }
    }

    protected onHistoryChanged(sender: HistoryManager) {
        if (!this.__navigationContext && sender.location) {
            const action = async () => {
                try {
                    await this.flipToUriString(sender.location)
                } catch (caught) {
                    LOG.error(`Invalid history location uri=${sender.location}`, caught)

                    if (this.fallbackPlace !== this.rootPlace) {
                        try {
                            await this.flip(this.fallbackPlace)
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

    // :: Application helpers

    public unexpected(message: string, error: unknown) {
        LOG.error(message, error)
    }

    public alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        switch (severity) {
            case 'error':
                LOG.error(`${title}: ${message}`)
                break
            case 'warning':
                LOG.warn(`${title}: ${message}`)
                break
            case 'success':
                LOG.info(`${title}: ${message}`)
                break
            default:
                LOG.debug(`${title}: ${message}`)
        }

        if (onClose) {
            onClose().catch(caught => {
                LOG.error('Closing alert', caught)
            })
        }
    }

}