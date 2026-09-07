/**
 * Reusable pieces of view, in the shape the composition strategy expects: a
 * function that takes the `Dom` it should declare into, and hands back whatever
 * the caller needs to hold on to.
 *
 * These are not custom elements. A widget here has no scope and no lifecycle —
 * it is markup that repeated often enough to deserve a name, which is exactly
 * what the `components/` folder does in the SWT project this strategy came from.
 */
export { AppDom, AppElement } from './AppDom'
export { actionButton, type ActionButtonOptions } from './action-button'
export { icon, ICONS, type Icon, type IconName } from './icon'
export { modalLayer, type ModalLayer, type ModalLayerOptions } from './modal-layer'
export { panel, type PanelOptions } from './panel'
