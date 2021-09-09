import React from 'react'
import { Scope, ApplicationPresenter, NOOP_VOID, Logger } from 'wdc-cube'

const LOG = Logger.get('React.FC')

type ReactType = typeof React

export function bindUpdate<S extends Scope>(react: ReactType, scope: S) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [__, setValue] = react.useState(0)

    if (scope.update === NOOP_VOID) {
        scope.update = () => setValue(value => value + 1)
    }

    react.useEffect(() => {
        LOG.debug(`scope(${scope.id}).attached`)

        return () => {
            scope.update = NOOP_VOID
            LOG.debug(`scope(${scope.id}).detached`)
        }
    }, [])
}

export function getOrCreateApplication<S extends Scope, A extends ApplicationPresenter<S>>(react: ReactType, factory: () => A) {
    const [app, setApp] = react.useState<A>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [__, setValue] = react.useState(0)

    react.useEffect(() => {
        return () => {
            if (app) {
                app.scope.update = NOOP_VOID
                setApp(undefined)
            }
            LOG.debug(`app.detached`)
        }
    }, [])

    if (app) {
        if (app.scope.update === NOOP_VOID) {
            app.scope.update = () => setValue(value => value + 1)
        }
        return app
    } else {
        const instance = factory()
        instance.scope.update = () => setValue(value => value + 1)
        instance.initialize()
        setApp(instance)
        LOG.debug(`app.attached`)
        return instance
    }
}