import { Logger } from '../utils/Logger'
import { Comparators } from '../utils/Comparators'
import { Place } from './Place'
import { FlipIntent, ValidParamTypes } from './FlipIntent'
import { HistoryManager } from './HistoryManager'
import { FlipContext } from './FlipContext'

import type { AlertSeverity, ICubePresenter, IPresenterOwner } from './IPresenter'

const LOG = Logger.get('Application')

export class Application implements IPresenterOwner {

    private __placeMap: Map<string, Place>

    private __presenterMap: Map<number, ICubePresenter>

    private __rootPlace: Place

    private __lastPlace: Place

    private __fragment?: string

    private __historyManager: HistoryManager

    private __flipContext?: FlipContext

    private __historyChangeUnregister: () => void

    public constructor(rootPlace: Place, historyManager: HistoryManager) {
        this.__rootPlace = rootPlace
        this.__lastPlace = rootPlace
        this.__historyManager = historyManager
        this.__presenterMap = new Map()
        this.__placeMap = new Map()
        this.__historyChangeUnregister = historyManager.addChangeListener(this.onHistoryChanged.bind(this))
    }

    public release(): void {
        this.__historyChangeUnregister()

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

    protected putPresenter(place: Place, presenter: ICubePresenter) {
        this.__presenterMap.set(place.id, presenter)
    }

    protected publishAllParameters(intent: FlipIntent) {
        for (const presenter of this.__presenterMap.values()) {
            if (presenter.publishParameters) {
                presenter.publishParameters(intent)
            }
        }
    }

    public newFlipIntent(place: Place): FlipIntent {
        const intent = new FlipIntent(place)
        this.publishAllParameters(intent)
        return intent
    }

    public newIntentFromString(sIntent: string): FlipIntent {
        const defaultPlace = this.__lastPlace ?? this.rootPlace
        if (sIntent) {
            return FlipIntent.parse(sIntent, name => this.__placeMap.get(name) || defaultPlace)
        } else {
            return new FlipIntent(defaultPlace)
        }
    }

    public updateHistory(): void {
        this.historyManager.update(this, this.lastPlace)
    }

    public getPresenter(place: Place) {
        return this.__presenterMap.get(place.id)
    }

    protected setPlaces(places: Record<string, Place>) {
        this.__placeMap.clear()
        for (const place of Object.values(places)) {
            this.__placeMap.set(place.name, place)
        }
    }

    public async flip(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }) {
        const intent = this.newFlipIntent(place)

        if (args?.params) {
            for (const [name, value] of Object.entries(args.params)) {
                intent.setParameter(name, value)
            }
        }

        if (args?.attrs) {
            for (const [name, value] of Object.entries(args.attrs)) {
                intent.attributes.set(name, value)
            }
        }

        await this.doFlipToNewPlace(intent)
    }

    public async flipToIntentString(sIntent: string) {
        const intent = this.newIntentFromString(sIntent)
        await this.doFlipToNewPlace(intent)
    }

    public async flipToIntent(intent: FlipIntent) {
        if (intent) {
            await this.doFlipToNewPlace(intent)
        } else {
            const defaultPlace = this.__lastPlace ?? this.rootPlace
            await this.doFlipToNewPlace(this.newFlipIntent(defaultPlace))
        }
    }

    protected async doFlipToNewPlace(intent: FlipIntent) {
        let context = this.__flipContext
        if (context) {
            context.targetIntent = intent
            const level = context.incrementAndGetLevel()
            await this.applyPathParameters(context, level)
        } else {
            context = new FlipContext(this, intent)
            try {
                this.__flipContext = context

                await this.applyPathParameters(context, 0)

                context.commit(this.__presenterMap)
                this.__lastPlace = context.targetIntent.place
            } catch (caught) {
                context.rollback()
                throw caught
            } finally {
                this.__flipContext = undefined
                this.updateHistory()
            }
        }
    }

    protected async applyPathParameters(context: FlipContext, atLevel: number) {
        const intent = context.targetIntent

        for (const place of intent.place.path) {
            if (place.id != -1 && !(await context.step(place, atLevel))) {
                break
            }
        }
    }

    protected onHistoryChanged(sender: HistoryManager) {
        const currentLocation = this.newFlipIntent(this.lastPlace).toString()

        if (!this.__flipContext && sender.location !== currentLocation) {
            const action = async () => {
                try {
                    await this.flipToIntentString(sender.location)
                } catch (caught) {
                    LOG.error(`Invalid history location intent=${sender.location}`, caught)

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
