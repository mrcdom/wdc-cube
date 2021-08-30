import React from 'react'
import { WFComponent, WFViewFactory } from '../webflow-react'
import style from './RootView.module.css'
import { RootPresenter } from './RootPresenter'

export class RootView extends WFComponent<RootPresenter> {

    public static factory = (presenter: RootPresenter) => (
        <RootView presenter={presenter} />
    )

    private readonly handleRootClick = () => this.props.presenter.oRootClicked()
    private readonly handleModule1Click = () => this.props.presenter.onModule1Clicked()
    private readonly handleModule2Click = () => this.props.presenter.onModule2Clicked()
    private readonly handleModule1DetailClick = () => this.props.presenter.onModule1DetailClicked()
    private readonly handleModule2DetailClick = () => this.props.presenter.onModule2DetailClicked()

    render() {
        let moduleView = WFViewFactory.createView(this.props.presenter.state.module)
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
                    <button className={style.BtnFirst} onClick={this.handleRootClick}>Root</button>
                    <button className={style.BtnOthers} onClick={this.handleModule1Click}>Module1</button>
                    <button className={style.BtnOthers} onClick={this.handleModule1DetailClick}>Module1-Detail</button>
                    <button className={style.BtnOthers} onClick={this.handleModule2Click}>Module2</button>
                    <button className={style.BtnOthers} onClick={this.handleModule2DetailClick}>Module2-Detail</button>
                </div>
                {moduleView}
            </div>
        </>
    }

}