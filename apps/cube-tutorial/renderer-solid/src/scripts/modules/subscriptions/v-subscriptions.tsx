import { Button } from '@kobalte/core/button'
import { For, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { SubscriptionsScope } from 'wdc-cube-tutorial-presentation/subscriptions'

import Css from './subscriptions.module.scss'

export function SubscriptionsView(props: ViewProps<SubscriptionsScope>): JSX.Element {
    return (
        <div class={Css.subscriptionsView}>
            <h1 class={Css.heading}>Sites you can subscribe to...</h1>
            <ul class={Css.list} aria-label="Sites you can subscribe to">
                {/* `<For>` keys on the item's own reference, so a row that keeps
                    its site keeps its DOM node and whatever state it held. */}
                <For each={props.scope.sites}>
                    {(site) => (
                        <li>
                            <Button class={Css.siteButton} onClick={() => props.scope.onItemClicked(site)}>
                                {site.site}
                            </Button>
                        </li>
                    )}
                </For>
            </ul>
        </div>
    )
}
