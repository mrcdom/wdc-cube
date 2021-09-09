import React from 'react'
import { Scope, ApplicationPresenter, ApplicationScope, NOOP_VOID } from 'wdc-cube'

type ReactType = typeof React

export function bindUpdate<S extends Scope>(react: ReactType, scope: S) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [__, setValue] = react.useState(0)
    const forceUpdate = () => setValue(value => value + 1)

    if (scope.update == NOOP_VOID) {
        scope.update = forceUpdate
    }

    react.useCallback(() => {
        return () => {
            scope.update = NOOP_VOID
        }
    }, [])
}

export function getOrCreateApplication<S extends Scope, A extends ApplicationPresenter<S>>(react: ReactType, factory: () => A) {
    const [app, setApp] = react.useState<A>()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [__, setValue] = react.useState(0)
    const forceUpdate = () => setValue(value => value + 1)

    react.useCallback(() => {
        return () => {
            if (app) {
                app.scope.update = NOOP_VOID
                setApp(undefined)
            }
        }
    }, [])

    if (!app) {
        const instance = factory()
        instance.scope.update = forceUpdate
        instance.initialize()
        setApp(instance)
        return instance
    } else {
        return app
    }
}