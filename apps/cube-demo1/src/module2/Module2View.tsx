import React, { HTMLAttributes } from 'react'
import { bindUpdate } from 'wdc-cube-react'
import { Module2Scope } from './Module2Presenter'
import Css from './Module2View.module.css'

type Module2ViewProps = { scope: Module2Scope } & HTMLAttributes<HTMLDivElement>

export function Module2View({ className, style, scope }: Module2ViewProps) {
    bindUpdate(React, scope)

    return (
        <div className={(className || '') + ' ' + Css.View} style={style}>
            <h1>Module2</h1>
        </div>
    )
}