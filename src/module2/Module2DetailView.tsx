import React from 'react'
import { WFComponent } from '../webflow-react'
import { Module2DetailPresenter } from './Module2DetailPresenter'

export class Module2DetailView extends WFComponent<Module2DetailPresenter> {

    public static readonly factory = (presenter: Module2DetailPresenter) => (
        <Module2DetailView presenter={presenter} />
    )

    render() {
        return <>
            <div style={{ backgroundColor: 'brown', padding: 20 }}>
            </div>
        </>
    }
}
