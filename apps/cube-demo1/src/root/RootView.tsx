import React from 'react'
import { WebFlowComponent, WebFlowViewFactory } from 'wdc-cube-react'
import { RootScope } from './RootPresenter'
import style from './RootView.module.css'

export class RootView extends WebFlowComponent<RootScope> {

    public override render() {
        const scope = this.props.scope

        let moduleView = WebFlowViewFactory.createView(scope.module)
        if (!moduleView) {
            moduleView = <>
                <div style={{ backgroundColor: 'green', padding: 20 }}>
                    Work area empty
                </div>
            </>
        }

        return <>
            <div className={style.View}>
                <span className={style.Title}>Exemplo de Webflow</span>
                <div className={style.Bar}>
                    <button className={style.BtnFirst} onClick={scope.onRoot}>Root</button>
                    <button className={style.BtnOthers} onClick={scope.onModule1}>Module1</button>
                    <button className={style.BtnOthers} onClick={scope.onModule1Detail}>Module1-Detail</button>
                    <button className={style.BtnOthers} onClick={scope.onModule2}>Module2</button>
                    <button className={style.BtnOthers} onClick={scope.onModule2Detail}>Module2-Detail</button>
                </div>
                {moduleView}
            </div>
        </>
    }

}