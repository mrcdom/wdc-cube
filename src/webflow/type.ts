export interface IPresenter {
    update: () => void
    release(): void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IParams = Record<string, any>

export interface IBasePresenter extends IPresenter {
    get state(): IViewState
    release(): void

    // eslint-disable-next-line no-unused-vars
    applyParams(target: IPlace, params: IParams, initializing: boolean): boolean

    // eslint-disable-next-line no-unused-vars
    exportParams(params: IParams): void
}

export interface IViewState {
    vid: string
    presenter: IPresenter
}

export interface IPlace {
    // eslint-disable-next-line no-unused-vars
    (oldPresenters: Record<string, IBasePresenter>, newPresenters: Record<string, IBasePresenter>, target: IPlace, params: IParams): Promise<boolean>
}

export interface IViewStateSlot {
    // eslint-disable-next-line no-unused-vars
    (state: IViewState): void
}