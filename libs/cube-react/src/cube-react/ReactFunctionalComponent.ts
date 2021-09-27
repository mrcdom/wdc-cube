import React from 'react'
import { Scope, Application, PlaceUri, NOOP_VOID, Logger } from 'wdc-cube'

const LOG = Logger.get('React.FC')

type ReactType = typeof React

function doUpdate(this: Scope, setValue: React.Dispatch<React.SetStateAction<number>>, value: number) {
    //LOG.debug(`${this.constructor.name}.update()`, new Error('doUpdate'))
    setValue(value + 1)
}

export function bindUpdate<S extends Scope>(react: ReactType, scope: S) {
    const [value, setValue] = react.useState(0)

    scope.forceUpdate = doUpdate.bind(scope, setValue, value)

    react.useEffect(() => {
        return () => {
            scope.forceUpdate = NOOP_VOID
        }
    }, [])
}

type IApplication<S extends Scope> = Application & {
    scope: S
    applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean>
}



export function getOrCreateApplication<S extends Scope, A extends IApplication<S>>(react: ReactType, factory: () => A) {
    const [app, setApp] = react.useState<A>()
    const [value, setValue] = react.useState(0)

    let instance: A
    if (app) {
        instance = app
        instance.scope.forceUpdate = doUpdate.bind(instance.scope, setValue, value)
    } else {
        instance = factory()
        setApp(instance)
        instance.scope.forceUpdate = doUpdate.bind(instance.scope, setValue, value)
        instance.applyParameters(instance.newUri(instance.rootPlace), true, true)
    }

    react.useEffect(() => {
        return () => {
            instance.scope.forceUpdate = NOOP_VOID
            setApp(undefined)
            LOG.debug('app.detached')
        }
    }, [])

    return instance
}