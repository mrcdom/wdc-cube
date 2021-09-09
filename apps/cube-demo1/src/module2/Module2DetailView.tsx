import React from 'react'
import { bindUpdate } from 'wdc-cube-react'
import { Module2DetailScope } from './Module2DetailPresenter'

export function Module2DetailView({ scope }: { scope: Module2DetailScope }) {
    bindUpdate(React, scope)

    return <>
        <div style={{ backgroundColor: 'brown', padding: 20 }}>
            Module2Detail
        </div>
    </>
}