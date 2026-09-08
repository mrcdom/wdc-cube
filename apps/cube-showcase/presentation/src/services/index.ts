import { SingletonServices } from 'wdc-cube'

import { ShowcaseService } from './ShowcaseService'

export function registerServices() {
    SingletonServices.add(ShowcaseService.INSTANCE)
}

export { ShowcaseService }
