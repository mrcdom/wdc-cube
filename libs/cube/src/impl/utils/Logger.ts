/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

type ILoggerMethodType = (context: string, ...data: unknown[]) => void

export interface ILogger {
    get context(): string

    info: ILoggerMethodType

    warn: ILoggerMethodType
    error: ILoggerMethodType
    debug: ILoggerMethodType

    isDebugEnabled(): boolean
    setDebugEnabled(value: boolean): void

    isInfoEnabled(): boolean
    setInfoEnabled(value: boolean): void

    isWarnEnabled(): boolean
    setWarnEnabled(value: boolean): void

    isErrorEnabled(): boolean
    setErrorEnabled(value: boolean): void
    caught(error: unknown): void
}

// :: Helpers

const ILogger_noop = (): void => {
    // NOOP
}

function ILogger_isDebugEnabled(this: ILogger): boolean {
    return this.debug !== ILogger_noop
}

function ILogger_setDebugEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.debug = console.debug.bind(console, this.context)
    } else {
        this.debug = ILogger_noop
    }
}

function ILogger_isInfoEnabled(this: ILogger): boolean {
    return this.info !== ILogger_noop
}

function ILogger_setInfoEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.info = console.info.bind(console, this.context)
    } else {
        this.info = ILogger_noop
    }
}

function ILogger_isWarnEnabled(this: ILogger): boolean {
    return this.warn !== ILogger_noop
}

function ILogger_setWarnEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.warn = console.warn.bind(console, this.context)
    } else {
        this.warn = ILogger_noop
    }
}

function ILogger_isErrorEnabled(this: ILogger): boolean {
    return this.error !== ILogger_noop
}

function ILogger_setErrorEnabled(this: ILogger, value: boolean): void {
    if (value) {
        this.error = console.error.bind(console, this.context)
    } else {
        this.error = ILogger_noop
    }
}

function ILogger_caught(this: ILogger, error: unknown): void {
    if (error instanceof Error) {
        this.error(error.message, error.stack)
    } else if (error) {
        this.error(String(error))
    }
}

declare const process: { env?: Record<string, string | undefined> } | undefined

function isDevelopmentEnv(): boolean {
    // `process` does not exist in a plain browser runtime; bundlers usually
    // replace the whole expression at build time.
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
}

export const Logger = (function () {
    const __instanceMap = new Map<string, ILogger>()

    let __defaultDebugFunction = ILogger_noop as ILoggerMethodType
    let __defaultInfoFunction = ILogger_noop as ILoggerMethodType
    let __defaultWarnFunction = console.warn as ILoggerMethodType
    let __defaultErrorFunction = console.error as ILoggerMethodType

    if (isDevelopmentEnv()) {
        __defaultDebugFunction = console.debug
        __defaultInfoFunction = console.info
    }

    const me = {
        setDebugEnabled,
        setInfoEnabled,
        setWarnEnabled,
        setErrorEnabled,
        get: getOrCreate
    }

    Object.seal(me)

    return me

    // Methods

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
                caught: ILogger_caught,

                isDebugEnabled: ILogger_isDebugEnabled,
                setDebugEnabled: ILogger_setDebugEnabled,

                isInfoEnabled: ILogger_isInfoEnabled,
                setInfoEnabled: ILogger_setInfoEnabled,

                isWarnEnabled: ILogger_isWarnEnabled,
                setWarnEnabled: ILogger_setWarnEnabled,

                isErrorEnabled: ILogger_isErrorEnabled,
                setErrorEnabled: ILogger_setErrorEnabled
            }

            logger.caught = ILogger_caught.bind(logger)

            __instanceMap.set(name, logger)
        }

        return logger
    }
})()
