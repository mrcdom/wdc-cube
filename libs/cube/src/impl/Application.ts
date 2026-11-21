/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Logger } from './utils/Logger.js'
import { Comparators } from './utils/Comparators.js'
import { Place } from './Place.js'
import { FlipIntent, ValidParamTypes } from './FlipIntent.js'
import { HistoryManager } from './HistoryManager.js'
import { FlipContext } from './FlipContext.js'

import type { AlertSeverity, ICubePresenter, IPresenterOwner } from './IPresenter.js'

const LOG = Logger.get('Application')

export class Application implements IPresenterOwner {
    private __placeMap: Map<string, Place>

    private __presenterMap: Map<number, ICubePresenter>

    private __rootPlace: Place

    private __lastPlace?: Place

    private __fragment?: string

    private __historyManager: HistoryManager

    private __flipContext?: FlipContext

    /**
     * An address the history moved to while a flip was running, read at the
     * moment it moved. Only the latest is kept: it is where the user wants to
     * be, and the ones before it were already left behind.
     */
    private __pendingLocation?: string

    private __historyChangeUnregister: () => void

    private __releasePhase = 0

    public constructor(rootPlace: Place, historyManager: HistoryManager) {
        this.__rootPlace = rootPlace
        this.__historyManager = historyManager
        this.__presenterMap = new Map()
        this.__placeMap = new Map()
        this.__historyChangeUnregister = historyManager.addChangeListener(this.onHistoryChanged.bind(this))
    }

    public release(): void {
        this.__releasePhase = 1
        try {
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
        } finally {
            this.__releasePhase = 2
        }
    }

    public get isReleasing(): boolean {
        return this.__releasePhase === 1
    }

    public get isReleased(): boolean {
        return this.__releasePhase > 0
    }

    public get historyManager() {
        return this.__historyManager
    }

    public get rootPlace(): Place {
        return this.__rootPlace
    }

    /**
     * The place last flipped to, or the root place before anything has been.
     *
     * The fallback is what every caller inside the framework wants — somewhere
     * to resolve an intent against — but it makes this useless for asking where
     * the user came from, since it cannot tell "at the root" from "nowhere yet".
     * Ask {@link hasNavigated} first when that distinction matters.
     */
    public get lastPlace(): Place {
        return this.__lastPlace ?? this.__rootPlace
    }

    /**
     * Whether a flip has completed, which is to say whether {@link lastPlace}
     * names somewhere the user has actually been.
     *
     * False while the application is starting, including for everything a deep
     * link builds on the way in: a presenter initialised by that first flip is
     * running before any place has been committed.
     */
    public get hasNavigated(): boolean {
        return this.__lastPlace !== undefined
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

    public getPresenter(place: Place) {
        return this.__presenterMap.get(place.id)
    }

    public removePresenter(place: Place) {
        const presenter = this.__presenterMap.get(place.id)
        if (presenter) {
            if (this.__flipContext) {
                this.__flipContext.removePresenter(place, presenter)
            }
            this.__presenterMap.delete(place.id)
        }
        return presenter
    }

    protected publishAllParameters(intent: FlipIntent) {
        for (const presenter of this.__presenterMap.values()) {
            if (presenter.publishParameters) {
                presenter.publishParameters(intent)
            }
        }
    }

    public forEachPresenter(callbackfn: (value: ICubePresenter) => void, thisArg?: unknown) {
        const me = thisArg ?? this
        this.__presenterMap.forEach((presenter) => {
            callbackfn.call(me, presenter)
        })
    }

    public newFlipIntent(place: Place): FlipIntent {
        const intent = new FlipIntent(place)
        intent.populateAttributes(this.__flipContext?.targetIntent.attributes)
        this.publishAllParameters(intent)
        return intent
    }

    public newIntentFromString(sIntent: string): FlipIntent {
        let intent: FlipIntent
        if (sIntent) {
            // An unknown name stays where the user is: a stale or mistyped link
            // should not throw them out of what they were doing.
            const defaultPlace = this.__lastPlace ?? this.rootPlace
            intent = FlipIntent.parse(sIntent, (name) => this.__placeMap.get(name) || defaultPlace)
        } else {
            // An empty address is not an unknown one: it is the root's. Resolving
            // it to the last place made Back to the root a no-op that left the
            // user stuck in the module they were trying to leave.
            intent = new FlipIntent(this.rootPlace)
        }

        intent.populateAttributes(this.__flipContext?.targetIntent.attributes)

        return intent
    }

    public updateHistory(): void {
        this.historyManager.update(this, this.lastPlace)
    }

    protected setPlaces(places: Record<string, Place>) {
        this.__placeMap.clear()
        for (const place of Object.values(places)) {
            this.__placeMap.set(place.name, place)
        }
    }

    public async flip(
        place: Place,
        args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }
    ) {
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
            let committed = false
            try {
                this.__flipContext = context

                await this.applyPathParameters(context, 0)

                context.commit(this.__presenterMap)
                this.__lastPlace = context.committedPlace
                committed = true
            } catch (caught) {
                await context.rollback()
                throw caught
            } finally {
                this.__flipContext = undefined

                const pending = this.__pendingLocation
                this.__pendingLocation = undefined

                if (committed && pending !== undefined && pending !== this.currentLocation()) {
                    // The user moved while this flip ran. Publishing this flip's
                    // address would write over theirs and lose it, so go where they
                    // went instead; that flip publishes when it lands.
                    this.followHistory(pending)
                } else {
                    // A failed attempt drops the pending move: it was asked of a
                    // state that never came to be.
                    this.updateHistory()
                }
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
        // Read now, not later: once the running flip lands it publishes its own
        // address, and reading then would find that one instead of the user's.
        const location = sender.location

        if (this.__flipContext) {
            this.__pendingLocation = location
        } else if (location !== this.currentLocation()) {
            this.followHistory(location)
        }
    }

    private currentLocation(): string {
        return this.newFlipIntent(this.lastPlace).toString()
    }

    private followHistory(location: string) {
        const previousIntent = this.newFlipIntent(this.lastPlace)

        this.flipToIntentString(location).catch((caught) => {
            LOG.error(`Invalid history location intent=${location}`, caught)

            this.flipToIntent(previousIntent).catch((caught) => {
                LOG.error('Problems returning to source', caught)
            })
        })
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
            onClose().catch((caught) => {
                LOG.error('Closing alert', caught)
            })
        }
    }
}
