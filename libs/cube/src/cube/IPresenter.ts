/* eslint-disable @typescript-eslint/no-unused-vars */

import { PlaceUri } from './PlaceUri'

export interface IPresenter {

    release(): void

    applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean>

    computeDerivatedFields(): void

    publishParameters(uri: PlaceUri): void

}