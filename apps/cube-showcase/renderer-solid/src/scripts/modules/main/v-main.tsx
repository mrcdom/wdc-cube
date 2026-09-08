import { Dialog } from '@kobalte/core/dialog'
import { For, Show, type JSX } from 'solid-js'
import { ViewSlot, type ViewProps } from 'wdc-cube-solid'
import { MainScope, NavItemScope } from 'wdc-cube-showcase-presentation/main'

import Css from './main.module.scss'

/**
 * The shell: a sidebar, the body, and the two modal layers.
 *
 * It knows nothing about issues or cycles. What the sidebar offers is a list of
 * scopes the presenter of whatever module is on screen handed over — so adding a
 * module does not mean editing this file, which is the arrangement the whole
 * architecture is for.
 */
export function MainView(props: ViewProps<MainScope>): JSX.Element {
    return (
        <Show when={props.scope.signedIn} fallback={<BareBody scope={props.scope} />}>
            <div class={Css.shell}>
                <nav class={Css.sidebar}>
                    <div class={Css.brand}>
                        <span class={Css.brandMark}>C</span>
                        <span>Cube Showcase</span>
                    </div>

                    <button class={Css.navItem} onClick={() => props.scope.onOpenProjects()}>
                        <Glyph name="projects" />
                        Projects
                    </button>

                    <Show when={props.scope.projectName}>
                        <div class={Css.sectionLabel}>{props.scope.projectName}</div>
                        <For each={props.scope.navigation}>{(item) => <NavItem scope={item} />}</For>
                    </Show>

                    <div class={Css.navSpacer} />

                    <Show when={props.scope.member}>
                        {(member) => (
                            <div class={Css.account}>
                                <span
                                    class={Css.avatar}
                                    style={{ background: `hsl(${member().hue} 62% 48%)` }}
                                    aria-hidden="true"
                                >
                                    {member().initials}
                                </span>
                                <span class={Css.accountName}>{member().name}</span>
                                <button
                                    class={Css.iconButton}
                                    title="Sign out"
                                    aria-label="Sign out"
                                    onClick={() => props.scope.onSignOut()}
                                >
                                    <Glyph name="sign-out" />
                                </button>
                            </div>
                        )}
                    </Show>
                </nav>

                <main class={Css.body}>
                    <ViewSlot scope={props.scope.body} />
                </main>

                <Modals scope={props.scope} />
            </div>
        </Show>
    )
}

/** Before there is a session there is no shell to speak of, only the door. */
function BareBody(props: { scope: MainScope }): JSX.Element {
    return (
        <div class={Css.bare}>
            <ViewSlot scope={props.scope.body} />
            <Modals scope={props.scope} />
        </div>
    )
}

function Modals(props: { scope: MainScope }): JSX.Element {
    return (
        <>
            <ModalLayer open={!!props.scope.dialog} onDismiss={() => props.scope.dialog?.onClose()}>
                <ViewSlot scope={props.scope.dialog} />
            </ModalLayer>

            {/* Above the dialog, so an alert raised from inside one dims it. */}
            <ModalLayer
                open={!!props.scope.alert}
                onDismiss={() => props.scope.alert?.onClose()}
                class={Css.alertLayer}
            >
                <ViewSlot scope={props.scope.alert} />
            </ModalLayer>
        </>
    )
}

function NavItem(props: { scope: NavItemScope }): JSX.Element {
    return (
        <button
            classList={{ [Css.navItem]: true, [Css.navItemCurrent]: props.scope.current }}
            onClick={() => props.scope.onSelect()}
        >
            <Glyph name={props.scope.icon} />
            {props.scope.label}
        </button>
    )
}

function ModalLayer(props: {
    open: boolean
    onDismiss: () => void
    class?: string
    children: JSX.Element
}): JSX.Element {
    // Where the focus was when this layer opened. A Kobalte dialog restores it to
    // its own trigger, and these have none — they open because a presenter put a
    // scope in a slot. `onOpenAutoFocus` fires just before the dialog takes the
    // focus, which is the one moment `document.activeElement` still says who had
    // it. Per layer, so a stacked alert returns to the dialog underneath.
    let openedFrom: Element | null = null

    return (
        <Dialog
            open={props.open}
            onOpenChange={(open) => {
                if (!open) {
                    props.onDismiss()
                }
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay classList={{ [Css.overlay]: true, [props.class ?? '']: !!props.class }} />
                <div classList={{ [Css.layer]: true, [props.class ?? '']: !!props.class }}>
                    <Dialog.Content
                        class={Css.surface}
                        onOpenAutoFocus={() => (openedFrom = document.activeElement)}
                        onCloseAutoFocus={(event) => {
                            if (!(openedFrom instanceof HTMLElement) || !openedFrom.isConnected) {
                                return
                            }
                            event.preventDefault()
                            openedFrom.focus()
                        }}
                    >
                        {props.children}
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}

const GLYPHS: Record<string, string> = {
    projects: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    dashboard: 'M3 13h4v8H3zM10 3h4v18h-4zM17 9h4v12h-4z',
    issues: 'M4 6h16M4 12h16M4 18h10',
    cycles: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
    'sign-out': 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3'
}

function Glyph(props: { name: string }): JSX.Element {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d={GLYPHS[props.name] ?? ''} />
        </svg>
    )
}
