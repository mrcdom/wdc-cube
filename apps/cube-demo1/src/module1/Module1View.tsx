import React, { HTMLAttributes } from 'react'
import clsx from 'clsx'
import { CubeComponent, ViewFactory } from 'wdc-cube-react'
import { Module1Scope } from './Module1Presenter'
import Css from './Module1View.module.css'

type Module1ViewProps = HTMLAttributes<HTMLDivElement> & { scope: Module1Scope }

export class Module1View extends CubeComponent<Module1Scope, HTMLDivElement, Module1ViewProps> {

  public override render() {
    const { className, style, scope } = this.props

    const detailView = ViewFactory.createView(scope.detail)

    return <>
      <div className={clsx(className, Css.View)} style={style}>
        <h1>Module1</h1>
        {detailView}
      </div>
    </>
  }

}