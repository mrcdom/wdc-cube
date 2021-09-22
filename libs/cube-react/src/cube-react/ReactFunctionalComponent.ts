import React from 'react'
import { Scope, Application, PlaceUri, NOOP_VOID, Logger } from 'wdc-cube'

const LOG = Logger.get('React.FC')

type ReactType = typeof React
type UpdatableScope = {
    update(): void
}

function doUpdate(this: UpdatableScope, setValue: React.Dispatch<React.SetStateAction<number>>, value: number) {
    //LOG.debug(`${this.constructor.name}.update()`, new Error('doUpdate'))
    setValue(value + 1)
}

export function bindUpdate<S extends UpdatableScope>(react: ReactType, scope: S) {
    const [value, setValue] = react.useState(0)

    scope.update = doUpdate.bind(scope, setValue, value)

    react.useEffect(() => {
        //LOG.debug(`scope(${scope.vid}).attached`)

        return () => {
            scope.update = NOOP_VOID
            //LOG.debug(`scope(${scope.vid}).detached`)
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

    react.useEffect(() => {
        return () => {
            if (app) {
                app.scope.update = NOOP_VOID
                setApp(undefined)
            }
            LOG.debug('app.detached')
        }
    }, [])

    if (app) {
        app.scope.update = doUpdate.bind(app.scope, setValue, value)
        return app
    } else {
        const instance = factory()
        instance.scope.update = doUpdate.bind(instance.scope, setValue, value)
        instance.applyParameters(instance.newUri(instance.rootPlace), true, true)
        setApp(instance)
        LOG.debug('app.attached')
        return instance
    }
}