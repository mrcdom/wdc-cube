/**
 * The application's own widgets.
 *
 * Every one is a custom element with a tag of its own, registered on import and
 * reached through a factory on `AppDom` — `dom.panel(...)` beside `dom.div(...)`,
 * which is how the SWT strategy this came from expresses its reusable pieces.
 * Where Spectrum has the component, the widget extends it and changes only what
 * this application needs; where it does not, the widget is a plain custom
 * element whose host is the box, with its styles in a shadow root of its own.
 */
export { AppDom, AppElement } from './AppDom'
export { AppActionButton } from './action-button'
export { AppAlertDialog, type AppAlertDialogVariant } from './alert-dialog'
export { AppModalLayer } from './modal-layer'
export { AppPanel } from './panel'
