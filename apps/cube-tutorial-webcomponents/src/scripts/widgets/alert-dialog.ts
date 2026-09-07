import { AlertDialog, alertDialogVariants, type AlertDialogVariants } from '@spectrum-web-components/alert-dialog'
import { css, html, type CSSResultArray, type TemplateResult } from '@spectrum-web-components/base'

import '@spectrum-web-components/icons-workflow/icons/sp-icon-checkmark-circle.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-info.js'

/**
 * The severities this application shows, which is Spectrum's list plus one.
 *
 * `AlertSeverity` has four — info, success, warning, error — and Spectrum names
 * confirmation, information, warning, error, destructive and secondary. Success
 * is the one it does not have, so rather than give up the distinction, or drop
 * back to a plain dialog and draw the whole header by hand, the component grows
 * the variant it is missing.
 */
export type AppAlertDialogVariant = AlertDialogVariants | 'success'

const VARIANTS: readonly AppAlertDialogVariant[] = [...alertDialogVariants, 'success']

/**
 * `sp-alert-dialog` with a success variant.
 *
 * Three small overrides, each of them a seam Spectrum left open: the setter that
 * decides which variants are accepted, `renderIcon`, and the styles. Everything
 * else — the grid, the divider, the button group, the labelling of heading and
 * content for assistive technology, the tab order when the content scrolls — is
 * the component's, and stays the component's.
 *
 * `information` gains an icon here too. Spectrum draws one only for warning and
 * error, which would leave this application showing an icon for three severities
 * out of four; both icons come from its own workflow set, and both colours from
 * its own semantic tokens, following the pattern the base class established for
 * the two it does draw.
 */
export class AppAlertDialog extends AlertDialog {
    public static override get styles(): CSSResultArray {
        return [
            ...super.styles,
            css`
                /*
                 * Spectrum's own dials, all of them --mod-*. The defaults are
                 * drawn for a dialog carrying a paragraph or two: 32px of
                 * padding and 48px between the text and the buttons leave the
                 * short messages this application shows adrift in white space,
                 * and a 20px icon reads as decoration rather than as the thing
                 * that says what kind of alert this is.
                 */
                :host {
                    --mod-alert-dialog-padding: var(--spectrum-spacing-400);
                    --mod-alert-dialog-description-to-buttons: var(--spectrum-spacing-400);
                    --mod-alert-dialog-icon-size: var(--spectrum-workflow-icon-size-300);
                    --mod-alert-dialog-title-font-size: var(--spectrum-heading-size-m);
                }

                /*
                 * The severity, as one colour. Everything it tints reads from
                 * here, so a dialog is coloured by what it is rather than by
                 * four rules that have to be kept in step.
                 */
                :host([variant='information']) {
                    --app-alert-dialog-accent-color: var(
                        --mod-alert-dialog-information-icon-color,
                        var(--spectrum-informative-visual-color)
                    );
                }

                :host([variant='success']) {
                    --app-alert-dialog-accent-color: var(
                        --mod-alert-dialog-success-icon-color,
                        var(--spectrum-positive-visual-color)
                    );
                }

                :host([variant='warning']) {
                    --app-alert-dialog-accent-color: var(
                        --mod-alert-dialog-warning-icon-color,
                        var(--spectrum-alert-dialog-warning-icon-color)
                    );
                }

                :host([variant='error']) {
                    --app-alert-dialog-accent-color: var(
                        --mod-alert-dialog-error-icon-color,
                        var(--spectrum-alert-dialog-error-icon-color)
                    );
                }

                /*
                 * Named one by one rather than as :host([variant]): the two
                 * variants this application never shows carry no accent, and
                 * pointing these at a custom property that is not set would
                 * leave the heading inheriting a colour instead of keeping its
                 * own.
                 */
                :host([variant='information']),
                :host([variant='success']),
                :host([variant='warning']),
                :host([variant='error']) {
                    --mod-icon-color: var(--app-alert-dialog-accent-color);
                    --mod-alert-dialog-title-color: var(--app-alert-dialog-accent-color);
                }

                /*
                 * spectrum-two hides the rule under the heading — its system
                 * token for it is transparent. Given back a colour, it is the
                 * one part of the dialog wide enough to read as its theme.
                 */
                .divider {
                    --spectrum-divider-background-color: var(--app-alert-dialog-accent-color, transparent);
                }

                /*
                 * The host is a flex container holding one child, and its own
                 * minimum width is wider than the short titles this application
                 * shows — so without this the grid hugs its text and the icon,
                 * the rule and the buttons all stop short of the right edge.
                 */
                .grid {
                    flex: 1 1 auto;
                    min-inline-size: 0;
                }
            `
        ]
    }

    /**
     * The base setter accepts only what `alertDialogVariants` lists, and the
     * attribute it writes is what the styles above select on — so widening the
     * list means restating the setter around it. It stays the property Lit
     * observes: setting the attribute from outside arrives here, as before.
     *
     * The getter keeps the base's narrower type, because that is the contract
     * the base class declares; `severity` below is how this class reads its own
     * value back.
     */
    public override set variant(variant: AppAlertDialogVariant) {
        if (variant === this.severity) {
            return
        }

        const oldValue = this.severity
        if (VARIANTS.includes(variant)) {
            this.setAttribute('variant', variant)
            this._variant = variant as AlertDialogVariants
        } else {
            this.removeAttribute('variant')
            this._variant = ''
        }

        this.requestUpdate('variant', oldValue)
    }

    public override get variant(): AlertDialogVariants {
        return this._variant
    }

    /** What `variant` holds, in the widened type this class actually stores. */
    public get severity(): AppAlertDialogVariant {
        return this._variant
    }

    protected override renderIcon(): TemplateResult {
        switch (this.severity) {
            case 'success':
                return html`<sp-icon-checkmark-circle class="icon"></sp-icon-checkmark-circle>`
            case 'information':
                return html`<sp-icon-info class="icon"></sp-icon-info>`
            default:
                return super.renderIcon()
        }
    }
}

customElements.define('app-alert-dialog', AppAlertDialog)

declare global {
    interface HTMLElementTagNameMap {
        'app-alert-dialog': AppAlertDialog
    }
}
