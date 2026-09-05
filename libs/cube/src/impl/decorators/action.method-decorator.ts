/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import _isFunction from 'lodash/isFunction'

import { type IPresenter, actionOnCatch, actionOnFinally, isPromiseLike } from '../IPresenter'

/**
 * Envolve o metodo do presenter com a guarda de acao (tratamento de erro,
 * update automatico e atualizacao do historico).
 *
 * @deprecated Prefira criar a guarda no momento de ligar o metodo ao escopo,
 * com `Presenter#action`:
 *
 * ```ts
 * this.scope.onSave = this.action(this.onSave)
 * ```
 *
 * Essa forma deixa explicito, no ponto da ligacao, o que e acao e o que nao e,
 * e permite guardar funcoes que nao sao metodos da propria classe
 * (`this.action(fn, outroPresenter)`).
 */
export function action() {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        if (_isFunction(descriptor.value)) {
            const instrumentedMethod = actionFn(descriptor.value)

            Object.defineProperty(instrumentedMethod, 'name', {
                value: propertyKey + '_action',
                configurable: true
            })

            descriptor.value = instrumentedMethod
        }
    }
}

function actionFn(impl: (...args: unknown[]) => Promise<void>) {
    return function (this: IPresenter, ...args: unknown[]): Promise<void> {
        const fnName = `${this.constructor.name}.${impl.name}`

        try {
            const result = impl.call(this, ...args) as unknown

            // Acao assincrona
            if (isPromiseLike(result)) {
                return (result as Promise<void>)
                    .catch((caught) => actionOnCatch(this, fnName, caught))
                    .finally(() => actionOnFinally(this))
            }

            // Acao sincrona
            actionOnFinally(this)
            return Promise.resolve()
        } catch (caught) {
            actionOnCatch(this, fnName, caught)
            actionOnFinally(this)
            return Promise.resolve()
        }
    }
}
