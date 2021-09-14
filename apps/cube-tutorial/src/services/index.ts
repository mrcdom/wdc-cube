import { Logger, ChangeMonitor } from 'wdc-cube'
import { TutorialService } from '../services/TutorialService'
import type { ServiceLike } from './ServiceLike'

const LOG = Logger.get('Services')

// @Inject
const changeMonitor = ChangeMonitor.INSTANCE

// @Inject
const tutorialService = TutorialService.INSTANCE

const serviceStack = [] as ServiceLike[]

async function bootService(name: string, service: ServiceLike, failed: string[]) {
    if (!service.initialized) {
        try {
            await service.postConstruct()
            serviceStack.push(service)
            LOG.debug(`${name} succesfully initialized`)
        } catch (caught) {
            LOG.error(`${name} failed to initialize`, caught)
            failed.push(name)
        }
    }
}

let runBootstrap = doBootstrap

async function noopBootstrap() {
    LOG.info('Initialized')
}

async function doBootstrap() {
    const failed = [] as string[]
    await bootService('changeMonitor', changeMonitor, failed)
    await bootService('tutorialService', tutorialService, failed)

    if (failed.length === 0) {
        runBootstrap = noopBootstrap
        noopBootstrap()
    } else {
        LOG.warn(`Initialized but some services failed: ${failed.join('; ')}.`)
    }
}

async function startServices() {
    runBootstrap()
}

async function stopServices() {
    let service = serviceStack.shift()
    while (service) {
        if (service.initialized) {
            await service.preDestroy()
        }
        service = serviceStack.shift()
    }
    LOG.info('Finalized')
}

export {
    startServices,
    stopServices,
    TutorialService
}