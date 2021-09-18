import { Logger } from './Logger'

const LOG = Logger.get('SingletonServices')

export type ServiceLike = {
    get initialized(): boolean
    get name(): string
    postConstruct(): Promise<void>
    preDestroy(): Promise<void>
}

const availableServices = [] as ServiceLike[]

const serviceStack = [] as ServiceLike[]

async function bootService(service: ServiceLike, failed: string[]) {
    if (!service.initialized) {
        try {
            await service.postConstruct()
            serviceStack.push(service)
            LOG.debug(`${service.name} succesfully initialized`)
        } catch (caught) {
            LOG.error(`${service.name} failed to initialize`, caught)
            failed.push(service.name)
        }
    }
}

let runBootstrap = doBootstrap

async function noopBootstrap() {
    LOG.info('Initialized')
}

async function doBootstrap() {
    const failed = [] as string[]

    for (const service of availableServices) {
        await bootService(service, failed)
    }
    //

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
    runBootstrap = doBootstrap
    LOG.info('Finalized')
}

let startCount = 0

export const SingletonServices = {

    add(service: ServiceLike) {
        availableServices.push(service)
    },

    async start() {
        try {
            await startServices()
        } catch (caught) {
            LOG.error('Starting', caught)
        } finally {
            if (serviceStack.length > 0) {
                startCount++
            }
        }
        return serviceStack.length > 0
    },

    async stop() {
        if (startCount > 0) {
            try {
                await stopServices()
            } finally {
                startCount--
            }
        }
    }
}