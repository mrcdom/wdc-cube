import { Logger } from '../utils/Logger'
import { Comparators } from '../utils/Comparators'
import { Place } from './Place'
import { FlipIntent } from './FlipIntent'
import { Application } from './Application'
import { CubePresenterInternals } from './CubePresenter'

import type { ICubePresenter } from './IPresenter'

const LOG = Logger.get('FlipContext')

export class FlipContext {
    private __app: Application
    private __presenterMap: Map<number, ICubePresenter>
    private __sourceIntent: FlipIntent
    private __targetIntent: FlipIntent
    private __level: number
    private __cycleDetectionMap: Map<string, number>

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
        let cycleCount = (this.__cycleDetectionMap.get(intent.place.pathName) ?? 0) + 1
        if (cycleCount > 5) {
            throw new Error(
                'Dectected a navigation cycle between ' +
                    `source(${this.__sourceIntent})=>target(${this.__targetIntent}). ` +
                    `The intermediate target was "${intent}"`
            )
        }

        this.__targetIntent = intent
        this.__cycleDetectionMap.set(intent.place.pathName, cycleCount)
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
            }
        }

        return result
    }

    public rollback(): void {
        for (const place of this.__sourceIntent.place.path) {
            if (place.id !== -1) {
                const presenter = this.__presenterMap.get(place.id)

                this.__presenterMap.delete(place.id)

                if (presenter != null) {
                    presenter.applyParameters(this.__sourceIntent, false, place === this.__sourceIntent.place)
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

        // Keep only presenters belonging to
        const targetPlace = this.__targetIntent.place

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
