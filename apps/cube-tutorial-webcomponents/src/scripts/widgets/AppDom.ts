import { CubeElement, Dom, type Configure, type DomRoot } from 'wdc-cube-webcomponents'
import type { Scope } from 'wdc-cube'

import { AppActionButton, type ActionButtonOptions } from './action-button'
import { AppAlertDialog } from './alert-dialog'
import { AppModalLayer, type ModalLayerOptions } from './modal-layer'
import { AppPanel, type PanelOptions } from './panel'

/**
 * The `Dom` this application declares into: the framework's, plus a factory for
 * each of its own widgets.
 *
 * `dom.actionButton(...)` beside `dom.div(...)` — one way of saying "put this
 * here", and the widgets show up under `dom.` when you go looking. It is how the
 * SWT strategy this came from expresses its reusable pieces.
 *
 * Each widget is a custom element, so a factory only creates one and hands it
 * whatever the call site chose. Nothing about how a widget is built or behaves
 * lives here, which is what keeps this a directory of components rather than a
 * second place to look for them.
 */
export class AppDom extends Dom {
    public constructor(root: DomRoot) {
        super(root)
    }

    /** What `Dom.render` builds when it is called on this class. */
    public static override create(root: DomRoot): AppDom {
        return new AppDom(root)
    }

    public actionButton(options: ActionButtonOptions): AppActionButton {
        return this.element('app-action-button', (button) => {
            button.textContent = options.label
            button.action = options.onClick
            button.context = options.context

            // Spectrum's default is accent, which is a page's one emphasised
            // button; most of the buttons here are not that one.
            button.variant = options.variant ?? 'primary'
        })
    }

    public alertDialog(configure?: Configure<AppAlertDialog>): AppAlertDialog {
        return this.element('app-alert-dialog', configure)
    }

    public modalLayer(options: ModalLayerOptions): AppModalLayer {
        return this.element('app-modal-layer', (layer) => {
            layer.context = options.context
            layer.onDismiss = options.onDismiss
            if (options.className) {
                layer.className = options.className
            }
        })
    }

    public panel(options: PanelOptions): AppPanel {
        return this.element('app-panel', () => {
            this.element(options.headingTag ?? 'h3', (heading) => (heading.textContent = options.heading))
            options.content?.(this)
        })
    }
}

/**
 * What every view in this application extends.
 *
 * Its only job is to say which `Dom` the views get; declaring that once here is
 * what keeps it out of each of them.
 */
export abstract class AppElement<S extends Scope = Scope> extends CubeElement<S, AppDom> {
    protected override createDom(root: DomRoot): AppDom {
        return AppDom.create(root)
    }
}
