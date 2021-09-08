import Logger from '../utils/logger'
import { Comparators } from './Comparators'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowURI } from './WebFlowURI'
import { WebFlowApplication } from './WebFlowApplication'
import type { WebFlowPresenterMapType } from './WebFlowPresenter'

const LOG = Logger.get('WebFlowApplication')

export class WebFlowNavigationContext {

    public targetUri: WebFlowURI

    private __app: WebFlowApplication
    private __presenterMap: WebFlowPresenterMapType
    private __sourceUri: WebFlowURI
    private __level: number

    public constructor(app: WebFlowApplication, targetUri: WebFlowURI) {
        this.__app = app
        this.__level = 0
        this.__sourceUri = app.newUri(app.lastPlace)
        this.__presenterMap = new Map()
        this.targetUri = targetUri

        this.extractPresenters(this.__presenterMap, app.lastPlace.path)
    }

    public get level(): number {
        return this.__level
    }

    public incrementAndGetLevel(): number {
        return ++this.__level
    }

    private extractPresenters(map: WebFlowPresenterMapType, path: WebFlowPlace[]) {
        for(const place of path) {
            const presenter = this.__app.getPresenter(place)
            if (presenter) {
                map.set(place.id, presenter)
            }
        }
        
    }

    public async build(level: number, place: WebFlowPlace, deepest: boolean) {
        // Only runs if this context is the last context
        if (this.__level === level) {
            const presenter = this.__presenterMap.get(place.id)
            if (presenter) {
                return await presenter.applyParameters(this.targetUri, false, deepest)
            } else {
                const presenter = place.factory(this.__app)
                this.__presenterMap.set(place.id, presenter)
                return await presenter.applyParameters(this.targetUri, true, deepest)
            }
        }

        return false
    }

    public rollback(): void {
        for (const place of this.__sourceUri.place.path) {
            const presenter = this.__presenterMap.get(place.id)
            if (presenter != null) {
                this.__presenterMap.delete(place.id)
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

    public commit(newPresenterMap: WebFlowPresenterMapType) {
        newPresenterMap.clear()

        // Keep only presenters belonging to 
        for (const place of this.targetUri.place.path) {
            let presenter = this.__presenterMap.get(place.id)
            if (presenter) {
                // Remove presenters that will be kept
                this.__presenterMap.delete(place.id)

                newPresenterMap.set(place.id, presenter)
                continue
            }

            LOG.error(`No presenter for place=${place.toString()}`)
        }

        // Non participating paresenter on new state must be released
        if (this.__presenterMap.size > 0) {
            this.releasePresenters(this.__presenterMap)
        }

        return newPresenterMap
    }

    private releasePresenters(presenterInstanceMap: WebFlowPresenterMapType): void {
        const presenterIds = [] as number[]

        for (const presenterId of presenterInstanceMap.keys()) {
            presenterIds.push(presenterId)
        }

        // release on reverse order (deepest level first)
        presenterIds.sort(Comparators.reverseOrderForNumber)

        for (const presenterId of presenterIds) {
            const presenter = presenterInstanceMap.get(presenterId)
            if (presenter != null) {
                try {
                    presenterInstanceMap.delete(presenterId)
                    presenter.release()
                } catch (caught) {
                    LOG.error('Releasing presenter', caught)
                }
            }
        }
    }

}