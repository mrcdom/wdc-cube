/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React from 'react'
import { Scope, ScopeConstructor } from 'wdc-cube'

export type IViewProps = {
  className?: string
  style?: React.CSSProperties
}

export type IViewConstructor<P extends IFactoryProps> =
  | React.ComponentClass<P>
  | React.FunctionComponent<P>

type IFactoryProps = IViewProps & {
  scope?: Scope
}

type ViewSlotProps<P extends IFactoryProps, S extends Scope> = IViewProps & {
  scope?: S | null
  optional?: boolean
  style?: React.CSSProperties
  view?: IViewConstructor<P>
}

export function ViewSlot<P extends IFactoryProps, S extends Scope>({
  scope,
  optional = true,
  view,
  ...props
}: ViewSlotProps<P, S>): React.ReactElement | null {
  if (scope) {
    if (view) {
      const ctor = view as IViewConstructor<IFactoryProps>
      return React.createElement(ctor, { scope, ...props })
    }

    const ctor = ViewFactory.get(scope)
    if (ctor) {
      return React.createElement(ctor, { scope, ...props })
    }

    return React.createElement(
      'div',
      { className: props.className, style: props.style },
      `View(${scope.constructor.name}) not found!`
    )
  }

  if (!optional) {
    return React.createElement('div', {
      className: props.className,
      style: props.style,
    })
  }

  return null
}

const VIEW_PROP_SYM = Symbol('VIEW')

export class ViewFactory {
  // Static API

  public static register<P extends IFactoryProps>(
    scopeCtor: ScopeConstructor,
    viewCtor: IViewConstructor<P>
  ): void {
    const dynScopeCtor = scopeCtor as unknown as Record<string | symbol, unknown>
    dynScopeCtor[VIEW_PROP_SYM] = viewCtor
  }

  public static get(scope?: Scope): IViewConstructor<IFactoryProps> | undefined {
    if (scope && scope.constructor) {
      const dynScopeCtor = scope.constructor as unknown as Record<string | symbol, unknown>
      return dynScopeCtor[VIEW_PROP_SYM] as IViewConstructor<IFactoryProps> | undefined
    }
    return undefined
  }

  public static createView(scope?: Scope, props?: IViewProps): React.ReactElement {
    if (props) {
      return React.createElement(ViewSlot, { scope, ...props })
    }
    return React.createElement(ViewSlot, { scope })
  }
}
