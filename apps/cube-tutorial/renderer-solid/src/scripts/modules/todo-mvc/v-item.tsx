import { onMount, Show, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { ItemScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import Css from './todo-mvc.module.scss'

export function ItemView(props: ViewProps<ItemScope>): JSX.Element {
    return (
        <li
            classList={{
                [Css.view]: true,
                [Css.completed]: props.scope.completed,
                [Css.editing]: props.scope.editing
            }}
        >
            <Show
                when={props.scope.editing}
                fallback={
                    <>
                        <input
                            class={Css.toggle}
                            type="checkbox"
                            checked={props.scope.completed}
                            onChange={() => props.scope.actions.onToggle()}
                        />
                        <label onDblClick={() => props.scope.actions.onEdit()}>{props.scope.title}</label>
                        <button class={Css.destroy} onClick={() => props.scope.actions.onDestroy()} />
                    </>
                }
            >
                {/* Built when editing starts and thrown away when it ends, so
                    the field always opens on the current title. */}
                <Editor scope={props.scope} />
            </Show>
        </li>
    )
}

/**
 * The edit field, as a component of its own so that it has a lifetime.
 *
 * `onMount` rather than `ref`: Solid calls a ref while the element is being
 * built, before it is in the document, and focusing an element that is not in
 * the document does nothing at all. React's ref callback fires after insertion,
 * which is why the same code works there and silently fails here — the field
 * opened unfocused, the typing went to the page, and pressing Enter committed an
 * empty title, which TodoMVC takes as "delete this item".
 */
function Editor(props: { scope: ItemScope }): JSX.Element {
    let field!: HTMLInputElement

    const currentText = () => field?.value ?? ''

    onMount(() => {
        field.value = props.scope.title
        field.focus()
        field.setSelectionRange(field.value.length, field.value.length)
    })

    return (
        <input
            ref={(node) => (field = node)}
            class={Css.edit}
            onBlur={() => props.scope.actions.onBlur(currentText)}
            onKeyDown={(event) => props.scope.actions.onKeyDown(currentText, event)}
        />
    )
}
