import { CubeElement, Dom, type Configure, type DomRoot } from 'wdc-cube-webcomponents'
import type { Scope } from 'wdc-cube'

import { AppActionButton } from './action-button'
import { AppAlertDialog } from './alert-dialog'
import { AppModalLayer } from './modal-layer'
import { AppPanel } from './panel'

/**
 * The `Dom` this application declares into: the framework's, plus a factory for
 * each of its own widgets.
 *
 * `dom.actionButton(...)` beside `dom.div(...)` — one way of saying "put this
 * here", and the widgets show up under `dom.` when you go looking. It is how the
 * SWT strategy this came from expresses its reusable pieces.
 *
 * Each widget is a custom element, so a factory only puts one in place and hands
 * it back — its own type is what says how to configure it, and that happens at
 * the call site like it does for every other element. Nothing about a widget
 * lives here, which is what keeps this a way to reach the components rather than
 * a second place to look for them.
 */
export class AppDom extends Dom {
    public constructor(root: DomRoot) {
        super(root)
    }

    /** What `Dom.render` builds when it is called on this class. */
    public static override create(root: DomRoot): AppDom {
        return new AppDom(root)
    }

    public actionButton(configure?: Configure<AppActionButton>): AppActionButton {
        return this.element('app-action-button', configure)
    }

    public alertDialog(configure?: Configure<AppAlertDialog>): AppAlertDialog {
        return this.element('app-alert-dialog', configure)
    }

    public modalLayer(configure?: Configure<AppModalLayer>): AppModalLayer {
        return this.element('app-modal-layer', configure)
    }

    public panel(configure?: Configure<AppPanel>): AppPanel {
        return this.element('app-panel', configure)
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
