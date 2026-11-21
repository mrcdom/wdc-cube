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
import { FlipIntent } from './FlipIntent.js'
import { Application } from './Application.js'
import { CubePresenterInternals } from './CubePresenter.js'

import type { ICubePresenter } from './IPresenter.js'

const LOG = Logger.get('FlipContext')

export class FlipContext {
    private __app: Application
    private __presenterMap: Map<number, ICubePresenter>
    private __sourceIntent: FlipIntent
    private __targetIntent: FlipIntent
    private __level: number
    private __cycleDetectionMap: Map<string, number>
    private __acceptedPlace?: Place

    public constructor(app: Application, targetIntent: FlipIntent) {
        this.__app = app
        this.__level = 0
        this.__sourceIntent = app.newFlipIntent(app.lastPlace)
        this.__cycleDetectionMap = new Map()
        this.__presenterMap = new Map()
        this.__targetIntent = targetIntent
        this.__cycleDetectionMap.set(this.targetIntent.place.pathName, 1)
        this.extractPresenters(this.__presenterMap, this.__sourceIntent.place.path)
    }

    public get targetIntent(): FlipIntent {
        return this.__targetIntent
    }

    public set targetIntent(intent: FlipIntent) {
        const cycleCount = (this.__cycleDetectionMap.get(intent.place.pathName) ?? 0) + 1
        if (cycleCount > 5) {
            throw new Error(
                'Dectected a navigation cycle between ' +
                    `source(${this.__sourceIntent})=>target(${this.__targetIntent}). ` +
                    `The intermediate target was "${intent}"`
            )
        }

        this.__targetIntent = intent
        this.__acceptedPlace = undefined
        this.__cycleDetectionMap.set(intent.place.pathName, cycleCount)
    }

    /**
     * Where this attempt actually got to: the deepest place accepted on the
     * current level, or the target when nothing narrowed it.
     *
     * A presenter that returns `false` without redirecting has accepted the
     * intent and stopped the composition there. The places below it were never
     * built, so committing the target would name, as the current place, one with
     * no presenter behind it.
     */
    public get committedPlace(): Place {
        return this.__acceptedPlace ?? this.__targetIntent.place
    }

    /**
     * Records `place` as reached, unless the attempt has moved on since: a
     * redirect raises the level, and the place reached is then the redirect's.
     */
    public accept(place: Place, atLevel: number) {
        if (this.__level === atLevel) {
            this.__acceptedPlace = place
        }
    }

    public get level(): number {
        return this.__level
    }

    public incrementAndGetLevel(): number {
        return ++this.__level
    }

    private extractPresenters(map: Map<number, ICubePresenter>, path: Place[]) {
        for (const place of path) {
            const presenter = this.__app.getPresenter(place)
            if (presenter) {
                map.set(place.id, presenter)
            }
        }
    }

    public async step(place: Place, atLevel: number) {
        let result = false

        // Only runs if this context is the last context
        if (this.__level === atLevel) {
            const latest = this.__targetIntent.place === place
            const presenter = this.__presenterMap.get(place.id)

            if (presenter) {
                result = await presenter.applyParameters(this.__targetIntent, false, latest)
            } else if (place.presenterCtor) {
                const presenter = new place.presenterCtor(this.__app)
                this.__presenterMap.set(place.id, presenter)
                result = await presenter.applyParameters(this.__targetIntent, true, latest)
                presenter.update()
            } else {
                result = true
            }

            if (this.__level !== atLevel) {
                result = false
            } else {
                this.__acceptedPlace = place
            }
        }

        return result
    }

    /**
     * Puts the presenters of the source place back the way they were, root to
     * leaf, and releases the ones this attempt created.
     *
     * Each restoration is awaited before the next one starts, so a parent has
     * handed out its slots again before its child looks for them. A restoration
     * that fails is reported and the others still run: this is already the
     * error path, and the error the caller sees is the one that started it.
     */
    public async rollback(): Promise<void> {
        for (const place of this.__sourceIntent.place.path) {
            if (place.id !== -1) {
                const presenter = this.__presenterMap.get(place.id)

                this.__presenterMap.delete(place.id)

                if (presenter != null) {
                    try {
                        await presenter.applyParameters(this.__sourceIntent, false, place === this.__sourceIntent.place)
                    } catch (caught) {
                        LOG.error(`Restoring presenter for place=${place.toString()}`, caught)
                    }
                } else {
                    LOG.warn(`Missing presenter for ID=${place.id}`)
                }
            }
        }

        if (this.__presenterMap.size > 0) {
            this.releasePresenters(this.__presenterMap)
            this.__presenterMap.clear()
        }
    }

    public commit(newPresenterMap: Map<number, ICubePresenter>) {
        newPresenterMap.clear()

        // Keep only presenters belonging to the place this attempt reached
        const targetPlace = this.committedPlace

        // Avoid processing detached places
        if (targetPlace.id !== -1) {
            for (const place of targetPlace.path) {
                const presenter = this.__presenterMap.get(place.id)
                if (presenter) {
                    // Remove presenters that will be kept
                    this.__presenterMap.delete(place.id)

                    newPresenterMap.set(place.id, presenter)
                    continue
                }

                LOG.error(`No presenter for place=${place.toString()}`)
            }
        }

        // Non participating paresenter on new state must be released
        if (this.__presenterMap.size > 0) {
            this.releasePresenters(this.__presenterMap)
        }

        return newPresenterMap
    }

    private releasePresenters(presenterInstanceMap: Map<number, ICubePresenter>): void {
        const presenterIds = [] as number[]

        for (const presenterId of presenterInstanceMap.keys()) {
            presenterIds.push(presenterId)
        }

        // release on reverse order (deepest level first)
        presenterIds.sort(Comparators.reverseOrderForNumber)

        for (const presenterId of presenterIds) {
            const presenter = presenterInstanceMap.get(presenterId)

            presenterInstanceMap.delete(presenterId)

            if (presenter) {
                try {
                    CubePresenterInternals.release.call(presenter)
                } catch (caught) {
                    LOG.error('Releasing presenter', caught)
                }
            }
        }
    }

    removePresenter(place: Place, presenter: ICubePresenter) {
        const otherPresenter = this.__presenterMap.get(place.id)
        if (otherPresenter === presenter) {
            this.__presenterMap.delete(place.id)
        }
    }
}
