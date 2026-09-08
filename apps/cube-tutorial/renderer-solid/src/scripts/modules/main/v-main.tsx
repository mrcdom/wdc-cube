import { Show, type JSX } from 'solid-js'
import { ViewSlot, type ViewProps } from 'wdc-cube-solid'
import { MainScope } from 'wdc-cube-tutorial-presentation/main'

import Css from './main.module.scss'

/**
 * The application shell: a bar, a body slot, and the two modal layers.
 *
 * This function body runs once, for the life of the application. Everything
 * that can change later is an expression Solid left behind — `scope.dialog` is
 * read inside `<Show>`, so opening a dialog wakes that one place and nothing
 * else here is touched, not even re-examined.
 */
export function MainView(props: ViewProps<MainScope>): JSX.Element {
    return (
        <div class={Css.mainView}>
            <div class={Css.appBar}>
                <span class={Css.appBarTitle}>Cube Framework (Tutorial Example)</span>
                <button class={Css.navButton} onClick={() => props.scope.onHome()}>
                    Home
                </button>
                <button class={Css.navButton} onClick={() => props.scope.onOpenTodos()}>
                    Todos
                </button>
                <button class={Css.navButton} onClick={() => props.scope.onOpenSuscriptions()}>
                    Subscriptions
                </button>
                <button class={Css.navButton} onClick={() => props.scope.onLogin()}>
                    Login
                </button>
            </div>

            <div class={Css.body}>
                <ViewSlot scope={props.scope.body} />
            </div>

            <Show when={props.scope.dialog}>
                <ModalLayer onDismiss={() => props.scope.dialog?.onClose()}>
                    <ViewSlot scope={props.scope.dialog} />
                </ModalLayer>
            </Show>

            {/* Above the dialog, so an alert raised from inside one dims it. */}
            <Show when={props.scope.alert}>
                <ModalLayer class={Css.alertLayer} onDismiss={() => props.scope.alert?.onClose()}>
                    <ViewSlot scope={props.scope.alert} />
                </ModalLayer>
            </Show>
        </div>
    )
}

function ModalLayer(props: { class?: string; onDismiss: () => void; children: JSX.Element }): JSX.Element {
    return (
        <div classList={{ [Css.modalLayer]: true, [props.class ?? '']: !!props.class }} onClick={props.onDismiss}>
            {/* Without this a click on the panel reaches the scrim behind and
                dismisses the very thing being clicked. */}
            <div class={Css.modalSurface} onClick={(event) => event.stopPropagation()}>
                {props.children}
            </div>
        </div>
    )
}
