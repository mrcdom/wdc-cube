import { Show, type JSX } from 'solid-js'
import { ViewSlot, type ViewProps } from 'wdc-cube-solid'
import { RestrictedScope } from 'wdc-cube-tutorial-presentation/restricted'

import Css from './restricted.module.scss'

export function RestrictedView(props: ViewProps<RestrictedScope>): JSX.Element {
    return (
        <div class={Css.restrictedView}>
            <Show when={props.scope.detail} fallback={<p>Nothing is nested under this place yet.</p>}>
                {/* The slot this presenter offers to a deeper place. Passing its
                    own scope here would resolve back to this very view. */}
                <ViewSlot scope={props.scope.detail} />
            </Show>
        </div>
    )
}
