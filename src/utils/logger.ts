interface Logger {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    info(...data: any[]): void
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    warn(...data: any[]): void
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    error(...data: any[]): void
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    debug(...data: any[]): void
}

const loggerInstanceMap = new Map<string, Logger>()


const unit = {

    get(name: string): Logger {
        let logger = loggerInstanceMap.get(name)

        if (!logger) {
            const context = `[${name}]`
            logger = {
                info: console.info.bind(console, context),
                warn: console.warn.bind(console, context),
                error: console.error.bind(console, context),
                debug: console.debug.bind(console, context),
            }

            loggerInstanceMap.set(name, logger)
        }

        return logger
    }

}

export default unit