const OperationalSystem = require('os')
const FileSystem = require('fs')
const Paths = require('path')
const ChildProcess = require('child_process')

const LOG = (function () {
    const FG_RED = '\x1b[31m'
    const FG_GREEN = '\x1b[32m'
    const FG_BLUE = '\x1b[34m'
    const FG_YELLOW = '\x1b[33m'
    const FG_MAGENTA = '\x1b[35m'
    const FG_WHITE = '\x1b[37m'
    const CONTEXT = '[DEPENDENCE-INSTALL]'
    return {
        log: console.log.bind(console, `${FG_GREEN}${CONTEXT}${FG_WHITE}`),
        info: console.info.bind(console, `${FG_BLUE}${CONTEXT}${FG_WHITE}`),
        warn: console.warn.bind(console, `${FG_YELLOW}${CONTEXT}${FG_WHITE}`),
        error: console.error.bind(console, `${FG_RED}${CONTEXT}${FG_WHITE}`),
        debug: console.debug.bind(console, `${FG_MAGENTA}${CONTEXT}${FG_WHITE}`)
    }
})()

async function main() {
    const libPaths = extractPathsFromArgV(process.argv)
    if (libPaths.length === 0) {
        throw new Error('Missing path argument to a lib folder')
    }

    for (const relativeLibsPath of libPaths) {
        const libsPath = Paths.resolve(__dirname, relativeLibsPath)
        if (isNpmProject(libsPath)) {
            const libPath = Paths.join(libsPath, folderName)
            await installOneLib(libPath, relativeLibsPath)
        } else {
            await installLibsUnderPath(libsPath, relativeLibsPath)
        }
    }
}

function extractPathsFromArgV(argumentsArray) {
    const libPaths = []
    let i = 2
    let argumentValue = argumentsArray[i]
    while (argumentValue) {
        libPaths.push(argumentValue)
        argumentValue = argumentsArray[++i]
    }
    return libPaths
}

function isNpmProject(libPath) {
    return FileSystem.existsSync(Paths.join(libPath, 'package.json'))
}

async function installLibsUnderPath(libsPath, relativeLibsPath) {
    for (const folderName of FileSystem.readdirSync(libsPath)) {
        const libPath = Paths.join(libsPath, folderName)

        if (isNpmProject(libPath)) {
            await installOneLib(libPath, Paths.join(relativeLibsPath, folderName))
        }
    }
}

async function installOneLib(libPath, name) {
    try {
        LOG.log(`Installing npm modules on '${name}' path...`)
        await npm_install(libPath)
    } catch (caught) {
        LOG.error(`Failed on installing npm modules on ${name} path.`, caught)
    }
}

// :: Helpers

const npm_install = (function () {
    const NPM_COMMAND = OperationalSystem.platform().startsWith('win') ? 'npm.cmd' : 'npm'

    return libPath => {
        return new Promise((resolve, reject) => {
            ChildProcess.exec(`${NPM_COMMAND} i ${libPath}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error)
                } else {
                    if (stderr) {
                        LOG.warn(stderr)
                    }
                    resolve()
                }
            })
        })
    }
})()

// :: Bootstrap

main().catch(caught => LOG.error(caught.message, caught.statck))
