import Logger from '../utils/logger'
import { Comparators } from './Comparators'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowURI } from './WebFlowURI'
import { WebFlowApplication } from './WebFlowApplication'
import type { WebFlowPresenterMapType } from './WebFlowPresenter'

const LOG = Logger.get('WebFlowApplication')

export class WebFlowNavigationContext {

    public targetUri: WebFlowURI

    private app: WebFlowApplication
    private presenterMap: WebFlowPresenterMapType
    private sourceUri: WebFlowURI
    private overlappedLevel: number

    public constructor(app: WebFlowApplication, curPresenterMap: WebFlowPresenterMapType, targetUri: WebFlowURI) {
        this.app = app
        this.targetUri = targetUri
        this.overlappedLevel = 0
        this.sourceUri = app.newUri(app.lastPlace)
        this.presenterMap = curPresenterMap
    }

    public incrementAndGetLevel(): number {
        return ++this.overlappedLevel
    }

    public async build(level: number, place: WebFlowPlace, deepest: boolean) {
        // Only runs if this context is the last context
        if (this.overlappedLevel === level) {
            const presenter = this.presenterMap.get(place.id)
            if (presenter) {
                return await presenter.applyParameters(this.targetUri, false, deepest)
            } else {
                const presenter = place.factory(this.app)
                this.presenterMap.set(place.id, presenter)
                return await presenter.applyParameters(this.targetUri, true, deepest)
            }
        }

        return false
    }

    public rollback(): void {
        for (const place of this.sourceUri.place.path) {
            const presenter = this.presenterMap.get(place.id)
            if (presenter != null) {
                this.presenterMap.delete(place.id)
                presenter.applyParameters(this.sourceUri, false, place === this.sourceUri.place)
            } else {
                LOG.warn(`Missing presenter for ID=${place.id}`)
            }
        }

        if (this.presenterMap.size > 0) {
            this.releasePresenters(this.presenterMap)
            this.presenterMap.clear()
        }
    }

    public commit(newPresenterMap: WebFlowPresenterMapType) {
        newPresenterMap.clear()

        // Keep only presenters belonging to 
        for (const place of this.targetUri.place.path) {
            let presenter = this.presenterMap.get(place.id)
            if (presenter) {
                // Remove presenters that will be kept
                this.presenterMap.delete(place.id)

                newPresenterMap.set(place.id, presenter)
                continue
            }

            LOG.error(`No presenter for place=${place.toString()}`)
        }

        // Non participating paresenter on new state must be released
        if (this.presenterMap.size > 0) {
            this.releasePresenters(this.presenterMap)
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