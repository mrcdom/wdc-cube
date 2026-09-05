import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, CubeRefObject, type IViewProps } from 'wdc-cube-react'
import Css from './todo-mvc.module.scss'
import { ItemScope, type KeyDownEvent } from '../todo-mvc.scope'

const LOG = Logger.get('TodoMvc.ItemView')

type ItemViewProps = IViewProps & { scope: ItemScope }

class ItemViewClass extends FCClass<ItemViewProps> {
    private readonly editTextField = new CubeRefObject<HTMLInputElement>()

    private readonly getCurrentEditText = () => this.editTextField.current?.value ?? ''

    // A ref callback instead of an effect keyed on scope.editing: React invokes
    // it exactly when the edit field enters and leaves the DOM.
    private readonly onEditFieldRef = (node: HTMLInputElement | null) => {
        this.editTextField.current = node
        if (node) {
            node.focus()
            node.setSelectionRange(node.value.length, node.value.length)
        }
    }

    private readonly onDestroy = () => this.scope.actions.onDestroy()
    private readonly onToggle = () => this.scope.actions.onToggle()
    private readonly onEdit = () => this.scope.actions.onEdit()
    private readonly onBlur = () => this.scope.actions.onBlur(this.getCurrentEditText)
    private readonly onKeyDown = (event: KeyDownEvent) => this.scope.actions.onKeyDown(this.getCurrentEditText, event)

    render({ className, style }: ItemViewProps) {
        LOG.debug('update')

        const scope = this.scope

        return (
            <li
                className={clsx(
                    className,
                    Css.view,
                    scope.completed ? Css.completed : '',
                    scope.editing ? Css.editing : ''
                )}
                style={style}
            >
                {scope.editing ? (
                    // The distinct keys stop React from reusing one DOM node for
                    // both the checkbox (controlled) and this field (uncontrolled).
                    // Remounting also makes defaultValue start from the current
                    // title on each entry into edit mode.
                    <input
                        key="edit"
                        ref={this.onEditFieldRef}
                        className={Css.edit}
                        defaultValue={scope.title}
                        onBlur={this.onBlur}
                        onKeyDown={this.onKeyDown}
                    />
                ) : (
                    <React.Fragment key="view">
                        <input
                            className={Css.toggle}
                            type="checkbox"
                            checked={scope.completed}
                            onChange={this.onToggle}
                        />
                        <label onDoubleClick={this.onEdit}>{scope.title}</label>
                        <button className={Css.destroy} onClick={this.onDestroy} />
                    </React.Fragment>
                )}
            </li>
        )
    }
}

export const ItemView = classToFComponent(ItemViewClass)
