/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React from 'react'
import { Scope, NOOP_VOID } from 'wdc-cube'
import { ReactComponent } from './ReactComponent.js'

export type CubeComponentProps<S extends Scope> = {
    key?: React.Key
    className?: string
    style?: React.CSSProperties
    scope: S
}

export class CubeComponent<
    SC extends Scope,
    P extends CubeComponentProps<SC> = { scope: SC },
    S = unknown,
    SS = unknown
> extends ReactComponent<P, S, SS> {
    public attached() {
        this.props.scope.forceUpdate = this.boundForceUpdate
    }

    public detached() {
        this.props.scope.forceUpdate = NOOP_VOID
    }

    private readonly boundForceUpdate = this.forceUpdate.bind(this)
}
