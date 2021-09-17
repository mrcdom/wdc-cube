import { SingletonServices } from 'wdc-cube'
import { TutorialService } from '../services/TutorialService'

// TODO: https://jsonplaceholder.typicode.com/

SingletonServices.add(TutorialService.INSTANCE)

async function startServices() {
    SingletonServices.start()
}

async function stopServices() {
    SingletonServices.stop()
}

export {
    startServices,
    stopServices,
    TutorialService
}