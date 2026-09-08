import { For, Show, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { ProjectCardScope, ProjectsScope } from 'wdc-cube-showcase-presentation/projects'

import Css from './projects.module.scss'

export function ProjectsView(props: ViewProps<ProjectsScope>): JSX.Element {
    return (
        <div class={Css.page}>
            <header class={Css.header}>
                <h1 class={Css.title}>Projects</h1>
                <p class={Css.subtitle}>Four of them, and every issue in each one is a place you can link to.</p>
            </header>

            <Show when={props.scope.error}>
                <p class={Css.error}>{props.scope.error}</p>
            </Show>

            <div class={Css.grid}>
                <Show
                    when={!props.scope.loading}
                    fallback={<For each={[0, 1, 2, 3]}>{() => <div class={Css.skeleton} />}</For>}
                >
                    <For each={props.scope.projects}>{(project) => <ProjectCard scope={project} />}</For>
                </Show>
            </div>
        </div>
    )
}

function ProjectCard(props: { scope: ProjectCardScope }): JSX.Element {
    return (
        <button class={Css.card} onClick={() => props.scope.onOpen()}>
            <div class={Css.cardTop}>
                <span class={Css.badge} style={{ background: `hsl(${props.scope.hue} 62% 48%)` }} aria-hidden="true">
                    {props.scope.projectKey}
                </span>
                <span class={Css.cardName}>{props.scope.name}</span>
            </div>
            <p class={Css.cardDescription}>{props.scope.description}</p>
            <div class={Css.cardFoot}>
                <span>{props.scope.issueCount} issues</span>
                <span>Led by {props.scope.leadName}</span>
            </div>
        </button>
    )
}
