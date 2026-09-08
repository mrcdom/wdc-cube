import type { Cycle, Issue, Member, Project } from 'wdc-cube-showcase-presentation/domain'

/**
 * The data the showcase runs on.
 *
 * Generated rather than typed out, and generated the same way every time: a
 * showcase that reads differently on each visit is a showcase nobody can point
 * at. The seeded generator below is deterministic for that reason.
 */

/** Mulberry32. Small, and the same sequence on every machine. */
function random(seed: number): () => number {
    let state = seed >>> 0
    return () => {
        state = (state + 0x6d2b79f5) >>> 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const pick = <T>(next: () => number, values: readonly T[]): T => values[Math.floor(next() * values.length)]

export const MEMBERS: Member[] = [
    { id: 'm1', name: 'Ana Ferreira', initials: 'AF', hue: 210 },
    { id: 'm2', name: 'Bruno Lima', initials: 'BL', hue: 145 },
    { id: 'm3', name: 'Carla Souza', initials: 'CS', hue: 280 },
    { id: 'm4', name: 'Diego Rocha', initials: 'DR', hue: 25 },
    { id: 'm5', name: 'Elisa Moreira', initials: 'EM', hue: 340 }
]

const PROJECT_SEEDS = [
    { id: 'p1', key: 'WEB', name: 'Web platform', hue: 210, leadId: 'm1', issues: 64 },
    { id: 'p2', key: 'API', name: 'Public API', hue: 145, leadId: 'm2', issues: 41 },
    { id: 'p3', key: 'MOB', name: 'Mobile app', hue: 280, leadId: 'm3', issues: 28 },
    { id: 'p4', key: 'OPS', name: 'Infrastructure', hue: 25, leadId: 'm4', issues: 17 }
]

const DESCRIPTIONS: Record<string, string> = {
    p1: 'The customer-facing application and everything rendered in a browser.',
    p2: 'The REST surface other teams build against, and its documentation.',
    p3: 'iOS and Android, sharing the platform team’s design system.',
    p4: 'Pipelines, environments and everything that has to be awake at 3am.'
}

const VERBS = ['Fix', 'Add', 'Remove', 'Refactor', 'Document', 'Investigate', 'Speed up', 'Simplify', 'Harden']
const NOUNS = [
    'the sign-in flow',
    'pagination on the issue list',
    'the export job',
    'avatar rendering',
    'the rate limiter',
    'stale cache entries',
    'the onboarding email',
    'keyboard navigation',
    'the audit log',
    'timezone handling',
    'the retry policy',
    'search relevance',
    'the settings page',
    'error reporting',
    'the migration script'
]
const LABELS = ['bug', 'feature', 'chore', 'design', 'performance', 'accessibility', 'security']
const STATES = ['backlog', 'todo', 'in-progress', 'done', 'cancelled'] as const
const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const

export type Dataset = {
    members: Member[]
    projects: Project[]
    issues: Issue[]
    cycles: Cycle[]
}

export function buildDataset(): Dataset {
    const next = random(20260908)
    const now = Date.UTC(2026, 8, 8)
    const day = 24 * 60 * 60 * 1000

    const cycles: Cycle[] = []
    const issues: Issue[] = []

    for (const seed of PROJECT_SEEDS) {
        for (let index = 0; index < 3; index++) {
            const startsAt = now + (index - 1) * 14 * day
            cycles.push({
                id: `${seed.id}-c${index + 1}`,
                projectId: seed.id,
                name: `Cycle ${index + 1}`,
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(startsAt + 13 * day).toISOString()
            })
        }

        const projectCycles = cycles.filter((cycle) => cycle.projectId === seed.id)

        for (let index = 1; index <= seed.issues; index++) {
            const state = pick(next, STATES)
            const labelCount = Math.floor(next() * 3)
            issues.push({
                id: `${seed.id}-i${index}`,
                projectId: seed.id,
                reference: `${seed.key}-${index}`,
                title: `${pick(next, VERBS)} ${pick(next, NOUNS)}`,
                description:
                    'Written by the seed generator so the showcase reads the same on every visit. ' +
                    'A real description would say what was observed, what was expected, and how to reproduce it.',
                state,
                priority: pick(next, PRIORITIES),
                assigneeId: next() > 0.15 ? pick(next, MEMBERS).id : undefined,
                cycleId: next() > 0.35 ? pick(next, projectCycles).id : undefined,
                labels: Array.from(new Set(Array.from({ length: labelCount }, () => pick(next, LABELS)))),
                createdAt: new Date(now - Math.floor(next() * 90) * day).toISOString(),
                updatedAt: new Date(now - Math.floor(next() * 14) * day).toISOString()
            })
        }
    }

    const projects: Project[] = PROJECT_SEEDS.map((seed) => ({
        id: seed.id,
        key: seed.key,
        name: seed.name,
        description: DESCRIPTIONS[seed.id],
        hue: seed.hue,
        leadId: seed.leadId,
        issueCount: issues.filter((issue) => issue.projectId === seed.id).length
    }))

    return { members: MEMBERS, projects, issues, cycles }
}
