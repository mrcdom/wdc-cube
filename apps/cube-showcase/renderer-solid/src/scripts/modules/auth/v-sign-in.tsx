import { For, Show, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { SignInScope } from 'wdc-cube-showcase-presentation/auth'

import Css from './auth.module.scss'

const initialsOf = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')

export function SignInView(props: ViewProps<SignInScope>): JSX.Element {
    return (
        <div class={Css.door}>
            <div class={Css.card}>
                <div class={Css.mark}>C</div>
                <h1 class={Css.title}>Sign in to the showcase</h1>
                <p class={Css.subtitle}>Pick who you would like to be. There is no password to remember.</p>

                <Show when={props.scope.error}>
                    <p class={Css.error}>{props.scope.error}</p>
                </Show>

                <div class={Css.people}>
                    <For each={props.scope.suggestions}>
                        {(name, index) => (
                            <button
                                classList={{ [Css.person]: true, [Css.personCurrent]: props.scope.name === name }}
                                onClick={() => props.scope.onNameChanged(name)}
                            >
                                <span
                                    class={Css.avatar}
                                    style={{ background: `hsl(${(index() * 67 + 210) % 360} 62% 48%)` }}
                                    aria-hidden="true"
                                >
                                    {initialsOf(name)}
                                </span>
                                {name}
                            </button>
                        )}
                    </For>
                </div>

                <button class={Css.primary} disabled={props.scope.busy} onClick={() => props.scope.onSignIn()}>
                    {props.scope.busy ? 'Signing in…' : 'Continue'}
                </button>

                <p class={Css.note}>The API is a service worker, so this whole page is a static deployment.</p>
            </div>
        </div>
    )
}
