import { http, HttpResponse, delay } from 'msw'
import type { Issue, Member, Page } from 'wdc-cube-showcase-presentation/domain'

import { buildDataset } from './seed'

/**
 * The API the showcase talks to.
 *
 * Real HTTP, answered by a service worker instead of a server. The service layer
 * makes ordinary `fetch` calls and knows nothing about this, so the whole
 * showcase deploys as static files and the link simply works — and pointing it at
 * a real server later is a change of base URL, not a rewrite.
 *
 * The latency is deliberate. A presenter that awaits a real wait has to deal
 * with a reader who navigates away mid-request, and the architecture is being
 * shown, not flattered.
 */
const data = buildDataset()

/**
 * Who is signed in, kept in `sessionStorage`.
 *
 * The handlers run in the page rather than in the worker, so a reload would
 * otherwise sign the reader out — and a reload signing you out would take the
 * showcase's own claim down with it: a link to an issue has to open that issue,
 * not a login form. The tab remembers; a new tab starts at the door, which is
 * what makes the door part of the demonstration rather than a formality.
 *
 * The data is *not* remembered. It is seeded the same way on every load, so a
 * visitor cannot wreck the demo for themselves with no way back.
 */
const SESSION_KEY = 'cube-showcase:session'

function readSession(): { member: Member } | undefined {
    try {
        const stored = sessionStorage.getItem(SESSION_KEY)
        if (!stored) {
            return undefined
        }
        const member = data.members.find((candidate) => candidate.id === stored)
        return member ? { member } : undefined
    } catch {
        // A tab with storage blocked simply signs in again.
        return undefined
    }
}

function writeSession(member?: Member): void {
    try {
        if (member) {
            sessionStorage.setItem(SESSION_KEY, member.id)
        } else {
            sessionStorage.removeItem(SESSION_KEY)
        }
    } catch {
        // Nothing to do: the session lives for this page instead.
        session = member ? { member } : undefined
    }
}

let session = readSession()

const jitter = () => delay(120 + Math.random() * 220)

export const handlers = [
    http.get('/api/session', async () => {
        await jitter()
        return session ? HttpResponse.json(session) : new HttpResponse(null, { status: 401 })
    }),

    http.post('/api/session', async ({ request }) => {
        await jitter()
        const { name } = (await request.json()) as { name: string }
        const member = data.members.find((candidate) => candidate.name === name)
        if (!member) {
            return HttpResponse.text(`Nobody here is called ${name}.`, { status: 400 })
        }
        session = { member }
        writeSession(member)
        return HttpResponse.json(session)
    }),

    http.delete('/api/session', async () => {
        await jitter()
        session = undefined
        writeSession(undefined)
        return new HttpResponse(null, { status: 204 })
    }),

    http.get('/api/members', async () => {
        await jitter()
        return HttpResponse.json(data.members)
    }),

    http.get('/api/projects', async () => {
        await jitter()
        return HttpResponse.json(data.projects)
    }),

    http.get('/api/projects/:projectId', async ({ params }) => {
        await jitter()
        const project = data.projects.find((candidate) => candidate.id === params.projectId)
        return project ? HttpResponse.json(project) : new HttpResponse(null, { status: 404 })
    }),

    http.get('/api/projects/:projectId/cycles', async ({ params }) => {
        await jitter()
        return HttpResponse.json(data.cycles.filter((cycle) => cycle.projectId === params.projectId))
    }),

    http.get('/api/projects/:projectId/issues', async ({ params, request }) => {
        await jitter()

        const url = new URL(request.url)
        const read = (name: string) => url.searchParams.get(name) ?? undefined
        const search = read('search')?.toLowerCase()

        const matching = data.issues.filter((issue) => {
            if (issue.projectId !== params.projectId) return false
            if (read('state') && issue.state !== read('state')) return false
            if (read('priority') && issue.priority !== read('priority')) return false
            if (read('assigneeId') && issue.assigneeId !== read('assigneeId')) return false
            if (read('cycleId') && issue.cycleId !== read('cycleId')) return false
            if (search && !`${issue.reference} ${issue.title}`.toLowerCase().includes(search)) return false
            return true
        })

        const perPage = Number(read('perPage') ?? 25)
        const page = Number(read('page') ?? 1)
        const from = (page - 1) * perPage

        const answer: Page<Issue> = {
            items: matching.slice(from, from + perPage),
            page,
            perPage,
            total: matching.length
        }
        return HttpResponse.json(answer)
    }),

    http.get('/api/issues/:issueId', async ({ params }) => {
        await jitter()
        const issue = data.issues.find((candidate) => candidate.id === params.issueId)
        return issue ? HttpResponse.json(issue) : new HttpResponse(null, { status: 404 })
    }),

    http.patch('/api/issues/:issueId', async ({ params, request }) => {
        await jitter()
        const issue = data.issues.find((candidate) => candidate.id === params.issueId)
        if (!issue) {
            return new HttpResponse(null, { status: 404 })
        }

        Object.assign(issue, await request.json(), { updatedAt: new Date().toISOString() })
        return HttpResponse.json(issue)
    })
]
