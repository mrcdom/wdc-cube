/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { History, createBrowserHistory, createHashHistory, Path } from 'history'
import { Application } from './Application.js'
import { Place } from './Place.js'
import { HistoryManager } from './HistoryManager.js'

export class PageHistoryManager extends HistoryManager {
    private __debounceHandler?: number

    private __history: History

    public constructor(useHash = false) {
        super()
        this.__history = useHash ? createHashHistory() : createBrowserHistory()
        this.__history.listen(this.emitOnChanged.bind(this))
    }

    /**
     * The address in the form the framework reads it, always plain.
     *
     * The path comes through untouched; only the query is handed to the codec,
     * and a query that is not an envelope comes back as it went in.
     */
    public get location() {
        const location = this.__history.location
        const query = this.decodeQuery(location.search.replace(/^\?/, ''))
        return location.pathname + (query ? '?' + query : '')
    }

    public override update(app: Application, place: Place): void {
        this.clearDebounceHandler()
        this.__debounceHandler = setTimeout(this.doUpdate.bind(this, app, place), 16)
    }

    private clearDebounceHandler() {
        if (this.__debounceHandler) {
            clearTimeout(this.__debounceHandler)
            this.__debounceHandler = undefined
        }
    }

    private doUpdate(app: Application, place: Place): void {
        const currentUri = app.newFlipIntent(place)
        const oldLocation = this.__history.location

        const query = currentUri.getQueryString()
        const encoded = this.encodeQuery(query)

        const newLocation: Partial<Path> = {
            pathname: place.name,
            search: encoded ? '?' + encoded : '',
            hash: ''
        }

        // Compared as plain text on both sides, and that is not a detail: a
        // codec may legitimately produce a different envelope for the same
        // state, and comparing envelope with envelope would push a history
        // entry on every scope update, forever.
        //
        // The one on screen is decoded rather than remembered, because a
        // remembered value goes stale — Back, Forward and an address edited by
        // hand all change it without passing through here. One decode costs
        // microseconds against the 16ms this call is already debounced by.
        const wasSearch = oldLocation.search.replace(/^\?/, '')
        const wasQuery = this.decodeQuery(wasSearch)

        // The state, and separately the form it is in. An application may
        // install or drop a codec while running — signing in and out are the
        // obvious moments — and then the state is the same while what should
        // travel is not. Asking *whether* there is an envelope stays stable for
        // a codec that never repeats one; asking which envelope would not.
        const changed =
            newLocation.pathname !== oldLocation.pathname ||
            query !== wasQuery ||
            this.isEnvelope(wasSearch) !== this.isEnvelope(encoded)

        if (changed) {
            this.__history.push(newLocation)
        }
    }

    private emitOnChanged() {
        this.notifyChanges()
    }
}
