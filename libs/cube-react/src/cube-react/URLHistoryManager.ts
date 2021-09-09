import { BrowserHistory, createBrowserHistory} from 'history'
import { Logger, HistoryManager } from 'wdc-cube'

const LOG = Logger.get('URLHistoryManager')

export class URLHistoryManager extends HistoryManager {

    private __debounceHandler?: NodeJS.Timeout

    private __doUpdateCallback = this.doUpdate.bind(this)

    private __browserHistory: BrowserHistory

    public constructor() {
        super()
        this.__browserHistory = createBrowserHistory()
        this.__browserHistory.listen(this.emitOnChanged.bind(this))
    }

    public override get location() {
        const location = this.__browserHistory.location
        if (location) {
            if(location.search) {
                return location.pathname.substring(1) + '?' + location.search
            } else {
                return location.pathname.substring(1)
            }
        }
        return ''
    }
    
    public override update(): void {
        if (this.__debounceHandler) {
            clearTimeout(this.__debounceHandler)
            this.__debounceHandler = undefined
        }
        this.__debounceHandler = setTimeout(this.__doUpdateCallback, 16)
    }

    private doUpdate(): void {
        const newLocation = this.tokenProvider()
        if(newLocation !== this.location) {
            this.__browserHistory.push(newLocation)
            LOG.info(this.location)
        }
    }

    private emitOnChanged() {
        const newLocation = this.tokenProvider()
        if(newLocation !== this.location) {
            this.onChangeListener(this)
        }
    }

}