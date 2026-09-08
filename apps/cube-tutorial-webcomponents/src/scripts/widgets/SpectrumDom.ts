import { Dom, type Configure, type DomRoot } from 'wdc-cube-webcomponents'

import { ButtonGroup } from '@spectrum-web-components/button-group'
import { Dialog } from '@spectrum-web-components/dialog'
import { FieldLabel } from '@spectrum-web-components/field-label'
import { SideNav, SideNavItem } from '@spectrum-web-components/sidenav'
import { Textfield } from '@spectrum-web-components/textfield'
import { TopNav, TopNavItem } from '@spectrum-web-components/top-nav'
import { Underlay } from '@spectrum-web-components/underlay'

import '@spectrum-web-components/button-group/sp-button-group.js'
import '@spectrum-web-components/dialog/sp-dialog.js'
import '@spectrum-web-components/field-label/sp-field-label.js'
import '@spectrum-web-components/sidenav/sp-sidenav.js'
import '@spectrum-web-components/sidenav/sp-sidenav-item.js'
import '@spectrum-web-components/textfield/sp-textfield.js'
import '@spectrum-web-components/top-nav/sp-top-nav.js'
import '@spectrum-web-components/top-nav/sp-top-nav-item.js'
import '@spectrum-web-components/underlay/sp-underlay.js'

/**
 * The Spectrum elements this application draws with, as declarations.
 *
 * `dom.spFieldLabel(...)` rather than `dom.element('sp-field-label', ...)`: a
 * component of the library is put in place the same way a div is, and reading
 * one is not a matter of recognising a string. What can be declared here is what
 * shows up under `dom.`, which is the whole point of declaring through it.
 *
 * The imports that define the elements are here too, next to the methods that
 * create them, so a factory cannot hand back an element the browser has not been
 * told about — a failure that shows as an inert box rather than as an error.
 */
export class SpectrumDom extends Dom {
    public static override create(root: DomRoot): SpectrumDom {
        return new SpectrumDom(root)
    }

    public spButtonGroup(configure?: Configure<ButtonGroup>): ButtonGroup {
        return this.element('sp-button-group', configure)
    }

    public spDialog(configure?: Configure<Dialog>): Dialog {
        return this.element('sp-dialog', configure)
    }

    public spFieldLabel(configure?: Configure<FieldLabel>): FieldLabel {
        return this.element('sp-field-label', configure)
    }

    public spSidenav(configure?: Configure<SideNav>): SideNav {
        return this.element('sp-sidenav', configure)
    }

    public spSidenavItem(configure?: Configure<SideNavItem>): SideNavItem {
        return this.element('sp-sidenav-item', configure)
    }

    public spTextfield(configure?: Configure<Textfield>): Textfield {
        return this.element('sp-textfield', configure)
    }

    public spTopNav(configure?: Configure<TopNav>): TopNav {
        return this.element('sp-top-nav', configure)
    }

    public spTopNavItem(configure?: Configure<TopNavItem>): TopNavItem {
        return this.element('sp-top-nav-item', configure)
    }

    public spUnderlay(configure?: Configure<Underlay>): Underlay {
        return this.element('sp-underlay', configure)
    }
}
