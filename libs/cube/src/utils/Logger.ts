type ILoggerMethodType = (context: string, ...data: unknown[]) => void

export interface ILogger {
    get context(): string

    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    info: ILoggerMethodType

    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    warn: ILoggerMethodType
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    error: ILoggerMethodType
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
    debug: ILoggerMethodType

    setDebugEnabled(value: boolean): void
    setInfoEnabled(value: boolean): void
    setWarnEnabled(value: boolean): void
    setErrorEnabled(value: boolean): void
}



// :: Helpers

const ILogger_noop = (): void => {
    // NOOP
}

function ILogger_setDebugEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.debug = console.debug.bind(console, this.context)
    } else {
        this.debug = ILogger_noop
    }
}

function ILogger_setInfoEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.info = console.info.bind(console, this.context)
    } else {
        this.info = ILogger_noop
    }
}

function ILogger_setWarnEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.warn = console.warn.bind(console, this.context)
    } else {
        this.warn = ILogger_noop
    }
}

function ILogger_setErrorEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.error = console.error.bind(console, this.context)
    } else {
        this.error = ILogger_noop
    }
}

export const Logger = function () {
    const __instanceMap = new Map<string, ILogger>()

    let __defaultDebugFunction = ILogger_noop as ILoggerMethodType
    let __defaultInfoFunction = ILogger_noop as ILoggerMethodType
    let __defaultWarnFunction = console.warn as ILoggerMethodType
    let __defaultErrorFunction = console.error as ILoggerMethodType

    const me = {
        setDebugEnabled,
        setInfoEnabled,
        setWarnEnabled,
        setErrorEnabled,

        get: getOrCreate
    }

    initialize()

    Object.seal(me)

    return me

    // Methods

    function initialize() {
        if ('production' !== process.env.NODE_ENV) {
            __defaultDebugFunction = console.debug
            __defaultInfoFunction = console.info

            if ('development' === process.env.NODE_ENV) {
                const $wnd = (window as unknown) as Record<string, unknown>
                const cube = ($wnd.WeDoCodeCube || {}) as { Logger?: unknown }
                cube.Logger = me
                $wnd.WeDoCodeCube = cube
            }
        }
    }

    function setDebugEnabled(value: boolean): void {
        if (value) {
            __defaultDebugFunction = console.debug
        } else {
            __defaultDebugFunction = ILogger_noop
        }

        for (const logger of __instanceMap.values()) {
            logger.setDebugEnabled(value)
        }
    }

    function setInfoEnabled(value: boolean): void {
        if (value) {
            __defaultInfoFunction = console.info
        } else {
            __defaultInfoFunction = ILogger_noop
        }

        for (const logger of __instanceMap.values()) {
            logger.setInfoEnabled(value)
        }
    }

    function setWarnEnabled(value: boolean): void {
        if (value) {
            __defaultWarnFunction = console.warn
        } else {
            __defaultWarnFunction = ILogger_noop
        }

        for (const logger of __instanceMap.values()) {
            logger.setWarnEnabled(value)
        }
    }

    function setErrorEnabled(value: boolean): void {
        if (value) {
            __defaultErrorFunction = console.error
        } else {
            __defaultErrorFunction = ILogger_noop
        }

        for (const logger of __instanceMap.values()) {
            logger.setErrorEnabled(value)
        }
    }

    function getOrCreate(name: string) {
        let logger = __instanceMap.get(name)

        if (!logger) {
            const context = `[${name}]`

            logger = {
                context,

                debug: __defaultDebugFunction.bind(console, context),
                info: __defaultInfoFunction.bind(console, context),
                warn: __defaultWarnFunction.bind(console, context),
                error: __defaultErrorFunction.bind(console, context),

                setDebugEnabled: ILogger_setDebugEnabled,
                setInfoEnabled: ILogger_setInfoEnabled,
                setWarnEnabled: ILogger_setWarnEnabled,
                setErrorEnabled: ILogger_setErrorEnabled,
            }

            __instanceMap.set(name, logger)
        }

        return logger
    }

}()