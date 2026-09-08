import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { type JSX } from 'solid-js'
import { ViewSlot, type ViewProps } from 'wdc-cube-solid'
import { MainScope } from 'wdc-cube-tutorial-presentation/main'

import Css from './main.module.scss'

/**
 * The application shell: a bar, a body slot, and the two modal layers.
 *
 * This function body runs once, for the life of the application. Everything
 * that can change later is an expression Solid left behind — `scope.dialog` is
 * read inside the dialog's `open`, so opening one wakes that one place and
 * nothing else here is touched, not even re-examined.
 */
export function MainView(props: ViewProps<MainScope>): JSX.Element {
    return (
        <div class={Css.mainView}>
            <div class={Css.appBar}>
                <span class={Css.appBarTitle}>Cube Framework (Tutorial Example)</span>
                <Button class={Css.navButton} onClick={() => props.scope.onHome()}>
                    Home
                </Button>
                <Button class={Css.navButton} onClick={() => props.scope.onOpenTodos()}>
                    Todos
                </Button>
                <Button class={Css.navButton} onClick={() => props.scope.onOpenSuscriptions()}>
                    Subscriptions
                </Button>
                <Button class={Css.navButton} onClick={() => props.scope.onLogin()}>
                    Login
                </Button>
            </div>

            <div class={Css.body}>
                <ViewSlot scope={props.scope.body} />
            </div>

            {/* Kobalte is what a dialog needs and a div does not: focus trapped
                while it is open and given back when it closes, Escape and a
                click outside both routed to the same place, and the page behind
                it hidden from assistive technology. `onOpenChange` is where all
                of those arrive, so the presenter hears them as one thing. */}
            <ModalLayer open={!!props.scope.dialog} onDismiss={() => props.scope.dialog?.onClose()}>
                <ViewSlot scope={props.scope.dialog} />
            </ModalLayer>

            {/* Above the dialog, so an alert raised from inside one dims it. */}
            <ModalLayer
                open={!!props.scope.alert}
                onDismiss={() => props.scope.alert?.onClose()}
                class={Css.alertLayer}
            >
                <ViewSlot scope={props.scope.alert} />
            </ModalLayer>
        </div>
    )
}

function ModalLayer(props: {
    open: boolean
    onDismiss: () => void
    class?: string
    children: JSX.Element
}): JSX.Element {
    return (
        <Dialog
            open={props.open}
            onOpenChange={(open) => {
                if (!open) {
                    props.onDismiss()
                }
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay classList={{ [Css.modalOverlay]: true, [props.class ?? '']: !!props.class }} />
                <div classList={{ [Css.modalLayer]: true, [props.class ?? '']: !!props.class }}>
                    <Dialog.Content class={Css.modalSurface}>{props.children}</Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
