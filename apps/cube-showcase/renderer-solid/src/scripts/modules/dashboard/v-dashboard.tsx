import { For, Show, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import {
    BarScope,
    DashboardScope,
    PersonLoadScope,
    SliceScope,
    StatScope
} from 'wdc-cube-showcase-presentation/dashboard'

import Css from './dashboard.module.scss'

/**
 * A project at a glance.
 *
 * The charts are SVG written here rather than a library, and that is a decision
 * rather than an omission: the only Solid chart wrapper has not been published
 * since 2024, and the alternatives draw to a canvas — which on a page whose
 * subject is a rendering architecture would be the one region nothing can be
 * said about.
 *
 * Every arc, share and length arrives already computed. A view that works out a
 * geometry is a view holding a rule about the data, and the next renderer would
 * have to work it out again.
 */
export function DashboardView(props: ViewProps<DashboardScope>): JSX.Element {
    return (
        <div class={Css.page}>
            <h1 class={Css.title}>{props.scope.projectName}</h1>
            <p class={Css.subtitle}>Every figure here is a link into the list that explains it.</p>

            <Show when={props.scope.error}>
                <p class={Css.error}>{props.scope.error}</p>
            </Show>

            <Show
                when={!props.scope.loading}
                fallback={
                    <div class={Css.stats}>
                        <For each={[0, 1, 2, 3]}>{() => <div class={Css.skeleton} />}</For>
                    </div>
                }
            >
                <div class={Css.stats}>
                    <For each={props.scope.stats}>{(stat) => <Stat scope={stat} />}</For>
                </div>

                <div class={Css.panels}>
                    <section class={Css.panel}>
                        <h2 class={Css.panelTitle}>Where the work is</h2>
                        <p class={Css.panelHint}>Issues by status. Press one to see them.</p>
                        <div class={Css.bars}>
                            <For each={props.scope.byState}>{(bar) => <Bar scope={bar} />}</For>
                        </div>
                    </section>

                    <section class={Css.panel}>
                        <h2 class={Css.panelTitle}>How urgent</h2>
                        <p class={Css.panelHint}>Issues by priority.</p>
                        <Ring scope={props.scope} />
                    </section>

                    <section classList={{ [Css.panel]: true, [Css.wide]: true }}>
                        <h2 class={Css.panelTitle}>Who is carrying what</h2>
                        <p class={Css.panelHint}>Open issues per person.</p>
                        <div class={Css.people}>
                            <For each={props.scope.workload}>{(person) => <Person scope={person} />}</For>
                        </div>
                    </section>
                </div>
            </Show>
        </div>
    )
}

function Stat(props: { scope: StatScope }): JSX.Element {
    return (
        <div
            classList={{
                [Css.stat]: true,
                [Css.statGood]: props.scope.tone === 'good',
                [Css.statWarn]: props.scope.tone === 'warn'
            }}
        >
            <div class={Css.statLabel}>{props.scope.label}</div>
            <div class={Css.statValue}>{props.scope.value}</div>
            <div class={Css.statHint}>{props.scope.hint}</div>
        </div>
    )
}

function Bar(props: { scope: BarScope }): JSX.Element {
    return (
        <button class={Css.bar} onClick={() => props.scope.onOpen()}>
            <span class={Css.barLabel}>{props.scope.label}</span>
            <span class={Css.barTrack}>
                <span class={Css.barFill} style={{ width: `${props.scope.share}%`, background: props.scope.colour }} />
            </span>
            <span class={Css.barValue}>{props.scope.value}</span>
        </button>
    )
}

/**
 * The ring.
 *
 * One circle per slice, drawn with a dash pattern: the dash is the slice's share
 * of the circumference and the offset is where it starts. Both numbers came from
 * the presenter, so this is arithmetic-free.
 */
function Ring(props: { scope: DashboardScope }): JSX.Element {
    const RADIUS = 54
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS

    return (
        <div class={Css.ringRow}>
            <div class={Css.ringCentre} style={{ width: '132px', height: '132px' }}>
                <svg class={Css.ring} width="132" height="132" viewBox="0 0 132 132">
                    <For each={props.scope.byPriority}>
                        {(slice) => (
                            <circle
                                cx="66"
                                cy="66"
                                r={RADIUS}
                                fill="none"
                                stroke={slice.colour}
                                stroke-width="18"
                                stroke-dasharray={`${(slice.share / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                                stroke-dashoffset={-(slice.offset / 100) * CIRCUMFERENCE}
                            />
                        )}
                    </For>
                </svg>
                <div class={Css.ringHole}>
                    <span class={Css.ringValue}>{props.scope.completion}%</span>
                    <span class={Css.ringLabel}>done</span>
                </div>
            </div>

            <div class={Css.legend}>
                <For each={props.scope.byPriority}>{(slice) => <Legend scope={slice} />}</For>
            </div>
        </div>
    )
}

function Legend(props: { scope: SliceScope }): JSX.Element {
    return (
        <button class={Css.legendRow} onClick={() => props.scope.onOpen()}>
            <span class={Css.swatch} style={{ background: props.scope.colour }} />
            <span class={Css.legendLabel}>{props.scope.label}</span>
            <span class={Css.legendValue}>{props.scope.value}</span>
        </button>
    )
}

function Person(props: { scope: PersonLoadScope }): JSX.Element {
    return (
        <button class={Css.person} onClick={() => props.scope.onOpen()}>
            <span class={Css.avatar} style={{ background: `hsl(${props.scope.hue} 62% 48%)` }} aria-hidden="true">
                {props.scope.initials}
            </span>
            <span>
                <span class={Css.personName}>{props.scope.name}</span>
                <span class={Css.personTrack}>
                    <span class={Css.personFill} style={{ width: `${props.scope.share}%` }} />
                </span>
            </span>
            <span class={Css.barValue}>{props.scope.open}</span>
        </button>
    )
}
