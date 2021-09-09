const instanceMap = new Map();
export class Logger {
    static get(name) {
        let logger = instanceMap.get(name);
        if (!logger) {
            const context = `[${name}]`;
            logger = {
                info: console.info.bind(console, context),
                warn: console.warn.bind(console, context),
                error: console.error.bind(console, context),
                debug: console.debug.bind(console, context),
            };
            instanceMap.set(name, logger);
        }
        return logger;
    }
}
//# sourceMappingURL=logger.js.map