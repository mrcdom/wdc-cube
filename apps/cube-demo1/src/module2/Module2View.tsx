import React from 'react'
import { bindUpdate, ViewFactory } from 'wdc-cube-react'
import { Module2Scope } from './Module2Presenter'

export function Module2View({ scope }: { scope: Module2Scope }) {
    bindUpdate(React, scope)

    const detailView = ViewFactory.createView(scope.detail)

    return <>
        <div style={{ backgroundColor: 'blue', padding: 20 }}>
            {detailView}
        </div>
    </>
}