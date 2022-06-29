import { Logger } from './Logger'

const LOG = Logger.get('SingletonServices')

export type ServiceLike = {
    get initialized(): boolean
    get name(): string
    postConstruct(): Promise<void>
    preDestroy(): Promise<void>
}

const availableServiceMap = new Map<ServiceLike, boolean>()

const serviceStack = [] as ServiceLike[]

let runBootstrap = doBootstrap

async function noopBootstrap() {
    LOG.info('Initialized')
}

async function doBootstrap() {
    const failed = [] as string[]

    for (const service of availableServiceMap.keys()) {
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
    //

    if (failed.length === 0) {
        runBootstrap = noopBootstrap
        noopBootstrap()
    } else {
        LOG.warn(`Initialized but some services failed: ${failed.join('; ')}.`)
    }
}

async function startServices() {
    await runBootstrap()
}

async function stopServices() {
    let service = serviceStack.shift()
    while (service) {
        if (service.initialized) {
            try {
                await service.preDestroy()
            } catch (caught) {
                LOG.error(`Unexpected error destroying service ${service.name}`, caught)
            }
        }
        service = serviceStack.shift()
    }
    runBootstrap = doBootstrap
    LOG.info('Finalized')
}

let startCount = 0

export const SingletonServices = {
    add(service: ServiceLike) {
        // Map preserves order
        if (!availableServiceMap.has(service)) {
            availableServiceMap.set(service, true)
        }
    },

    async remove(service: ServiceLike) {
        if (availableServiceMap.delete(service) && service.initialized) {
            try {
                await service.preDestroy()
            } catch (caught) {
                LOG.error(`Unexpected error destroying service ${service.name}`, caught)
            }
        }
    },

    async start() {
        try {
            await startServices()
        } catch (caught) {
            LOG.error('Starting', caught)
        }

        startCount++
        return SingletonServices.stop
    },

    async stop() {
        if (startCount > 0) {
            startCount--
            if (startCount === 0) {
                await stopServices()
            }
        }
    }
}
