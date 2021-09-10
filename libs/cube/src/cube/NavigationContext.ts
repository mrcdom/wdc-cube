import { Logger } from '../utils/Logger'
import { Comparators } from '../utils/Comparators'
import { Place } from './Place'
import { PlaceUri } from './PlaceUri'
import { Application } from './Application'
import type { PresenterMapType } from './Presenter'

const LOG = Logger.get('NavigationContext')

export class NavigationContext {

    private __app: Application
    private __presenterMap: PresenterMapType
    private __sourceUri: PlaceUri
    private __targetUri: PlaceUri
    private __level: number
    private __cycleDetectionMap: Map<string, boolean>

    public constructor(app: Application, targetUri: PlaceUri) {
        this.__app = app
        this.__level = 0
        this.__sourceUri = app.newUri(app.lastPlace)
        this.__cycleDetectionMap = new Map()
        this.__presenterMap = new Map()
        this.__targetUri = targetUri
        this.__cycleDetectionMap.set(this.targetUri.place.pathName, true)
        this.extractPresenters(this.__presenterMap, this.__sourceUri.place.path)
    }

    public get targetUri(): PlaceUri {
        return this.__targetUri
    }

    public set targetUri(uri: PlaceUri) {
        if (this.__cycleDetectionMap.has(uri.place.pathName)) {
            throw new Error(
                'Dectected a navigation cycle between '
                + `source(${this.__sourceUri})=>target(${this.__targetUri}). `
                + `The intermediate target was "${uri}"`
            )
        }
        this.__targetUri = uri
        this.__cycleDetectionMap.set(uri.place.pathName, true)
    }

    public get level(): number {
        return this.__level
    }

    public incrementAndGetLevel(): number {
        return ++this.__level
    }

    private extractPresenters(map: PresenterMapType, path: Place[]) {
        for (const place of path) {
            const presenter = this.__app.getPresenter(place)
            if (presenter) {
                map.set(place.id, presenter)
            }
        }
    }

    public async build(place: Place, atLevel: number) {
        let result = false

        // Only runs if this context is the last context
        if (this.__level === atLevel) {
            const deepest = this.__targetUri.place === place
            const presenter = this.__presenterMap.get(place.id)

            if (presenter) {
                result = await presenter.applyParameters(this.__targetUri, false, deepest)
            } else if (place.factory) {
                const presenter = place.factory(this.__app)
                this.__presenterMap.set(place.id, presenter)
                result = await presenter.applyParameters(this.__targetUri, true, deepest)
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
        for (const place of this.__sourceUri.place.path) {
            const presenter = this.__presenterMap.get(place.id)

            this.__presenterMap.delete(place.id)

            if (presenter != null) {
                presenter.applyParameters(this.__sourceUri, false, place === this.__sourceUri.place)
            } else {
                LOG.warn(`Missing presenter for ID=${place.id}`)
            }
        }

        if (this.__presenterMap.size > 0) {
            this.releasePresenters(this.__presenterMap)
            this.__presenterMap.clear()
        }
    }

    public commit(newPresenterMap: PresenterMapType) {
        newPresenterMap.clear()

        // Keep only presenters belonging to 
        const targetPlace = this.__targetUri.place

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

    private releasePresenters(presenterInstanceMap: PresenterMapType): void {
        const presenterIds = [] as number[]

        for (const presenterId of presenterInstanceMap.keys()) {
            presenterIds.push(presenterId)
        }

        // release on reverse order (deepest level first)
        presenterIds.sort(Comparators.reverseOrderForNumber)

        for (const presenterId of presenterIds) {
            const presenter = presenterInstanceMap.get(presenterId)

            presenterInstanceMap.delete(presenterId)

            if (presenter != null) {
                try {
                    presenter.release()
                } catch (caught) {
                    LOG.error('Releasing presenter', caught)
                }
            }
        }
    }

}