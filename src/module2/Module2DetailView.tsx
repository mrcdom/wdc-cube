import React from 'react'
import { WebFlowComponent } from '../webflow-react'
import { Module2DetailScope } from './Module2DetailPresenter'

export class Module2DetailView extends WebFlowComponent<Module2DetailScope> {

    public override render() {
        return <>
            <div style={{ backgroundColor: 'brown', padding: 20 }}>
                Module2Detail
            </div>
        </>
    }

}
