/* eslint-disable @typescript-eslint/no-unused-vars */

import { PlaceUri } from './PlaceUri'

export interface IPresenter {

    release(): void

    emitBeforeScopeUpdate(): void

    applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean>

    publishParameters(uri: PlaceUri): void

}