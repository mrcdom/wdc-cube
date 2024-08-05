import React from 'react'
import { Scope, Application, FlipIntent, NOOP_VOID, Logger } from 'wdc-cube'

const LOG = Logger.get('React.FC')

type ReactType = typeof React

function doUpdate(this: Scope, setValue: React.Dispatch<React.SetStateAction<number>>, value: number) {
    //LOG.debug(`${this.constructor.name}.update()`, new Error('doUpdate'))
    setValue(value + 1)
}

export function bindUpdate<S extends Scope>(reactRef: unknown, scope: S) {
    const react = reactRef as ReactType
    const [value, setValue] = react.useState(0)

    scope.forceUpdate = doUpdate.bind(scope, setValue, value)

    react.useEffect(() => {
        scope.forceUpdate = doUpdate.bind(scope, setValue, value)
        return () => {
            scope.forceUpdate = NOOP_VOID
        }
    }, [])

    return scope
}

type IApplication<S extends Scope> = Application & {
    scope: S
    applyParameters(intent: FlipIntent, initialization: boolean, deepest?: boolean): Promise<boolean>
}

export function getOrCreateApplication<S extends Scope, A extends IApplication<S>>(react: ReactType, factory: () => A) {
    const [app, setApp] = react.useState<A | null>(null)
    const [value, setValue] = react.useState(0)

    let instance: A
    if (app) {
        instance = app
        instance.scope.forceUpdate = doUpdate.bind(instance.scope, setValue, value)
    } else {
        instance = factory()
        setApp(instance)
        instance.scope.forceUpdate = doUpdate.bind(instance.scope, setValue, value)
        instance.applyParameters(instance.newFlipIntent(instance.rootPlace), true, true)
    }

    react.useEffect(() => {
        return () => {
            instance.scope.forceUpdate = NOOP_VOID
            setApp(null)
            LOG.debug('app.detached')
        }
    }, [])

    return instance
}
