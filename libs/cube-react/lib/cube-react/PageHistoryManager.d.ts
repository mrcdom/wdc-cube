import { Application, Place, HistoryManager } from 'wdc-cube';
export declare class PageHistoryManager extends HistoryManager {
    private __debounceHandler?;
    private __history;
    constructor(useHash?: boolean);
    get location(): string;
    update(app: Application, place: Place): void;
    private clearDebounceHandler;
    private doUpdate;
    private emitOnChanged;
}
