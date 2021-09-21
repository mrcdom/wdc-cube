import { SingletonServices } from 'wdc-cube'
import { TutorialService } from '../services/TutorialService'

// TODO: https://jsonplaceholder.typicode.com/
// TODO: https://swapi.dev/

function registerServices() {
    SingletonServices.add(TutorialService.INSTANCE)
}

export {
    TutorialService,
    registerServices
}