import { History, createBrowserHistory, createHashHistory, Path } from 'history'
import { Application, Place, HistoryManager } from 'wdc-cube'

export class PageHistoryManager extends HistoryManager {

    private __debounceHandler?: NodeJS.Timeout

    private __history: History

    public constructor(useHash = false) {
        super()
        this.__history = useHash ? createHashHistory() : createBrowserHistory()
        this.__history.listen(this.emitOnChanged.bind(this))
    }

    public get location() {
        const location = this.__history.location
        return location.pathname + location.search
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
        const currentUri = app.newUri(place)

        const oldLocation = this.__history.location

        const qs = currentUri.getQueryString()
        const newLocation: Partial<Path> = {
            pathname: place.name,
            search: qs ? '?' + currentUri.getQueryString() : '',
            hash: ''
        }

        if (newLocation.pathname !== oldLocation.pathname || newLocation.search !== oldLocation.search) {
            this.__history.push(newLocation)
        }
    }

    private emitOnChanged() {
        this.onChangeListener(this)
    }

}