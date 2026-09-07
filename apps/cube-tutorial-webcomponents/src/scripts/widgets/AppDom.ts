import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import type { Scope } from 'wdc-cube'

import { actionButton, type ActionButtonOptions } from './action-button'
import { icon, type Icon } from './icon'
import { modalLayer, type ModalLayer, type ModalLayerOptions } from './modal-layer'
import { panel, type PanelOptions } from './panel'

/**
 * The `Dom` this application declares into: the framework's, plus a factory for
 * each of its own widgets.
 *
 * `dom.actionButton(...)` beside `dom.div(...)` rather than
 * `actionButton(dom, ...)` — one way of saying "put this here", and the widgets
 * show up under `dom.` when you go looking. It is how the SWT strategy this came
 * from expresses its reusable pieces, and the methods stay one line each so the
 * widgets remain plain functions that can be used, and tested, on their own.
 */
export class AppDom extends Dom {
    public constructor(root: Element) {
        super(root)
    }

    /** What `Dom.render` builds when it is called on this class. */
    public static override create(root: Element): AppDom {
        return new AppDom(root)
    }

    public actionButton(options: ActionButtonOptions): HTMLButtonElement {
        return actionButton(this, options)
    }

    public panel(options: PanelOptions): HTMLDivElement {
        return panel(this, options)
    }

    public modalLayer(options: ModalLayerOptions): ModalLayer {
        return modalLayer(this, options)
    }

    public icon(path?: string): Icon {
        return icon(this, path)
    }
}

/**
 * What every view in this application extends.
 *
 * Its only job is to say which `Dom` the views get; declaring that once here is
 * what keeps it out of each of them.
 */
export abstract class AppElement<S extends Scope = Scope> extends CubeElement<S, AppDom> {
    protected override createDom(root: Element): AppDom {
        return AppDom.create(root)
    }
}
