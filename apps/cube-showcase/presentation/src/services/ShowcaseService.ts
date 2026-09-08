/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Logger, type ServiceLike } from 'wdc-cube'

import type { Cycle, Id, Issue, IssueQuery, Member, Page, Project, Session } from '../domain'

const LOG = Logger.get('ShowcaseService')

/**
 * The application's one way out.
 *
 * These are real HTTP calls. What answers them in the demo is a worker that
 * intercepts them, so the showcase deploys as static files and its link simply
 * works — but nothing here knows that, and pointing `baseUrl` at a server is the
 * whole of the change if one ever exists.
 *
 * That is not decoration. A presenter that awaits a real request has to deal
 * with latency, failure, and a reader who navigates away before the answer
 * arrives; a presenter reading an array in memory never does. The showcase is
 * about the architecture holding up, so the boundary it holds up across has to
 * be a real one.
 */
export class ShowcaseService implements ServiceLike {
    public static readonly INSTANCE = new ShowcaseService()

    private __initialized = false

    /** Where the API is. The demo answers it from a worker; a server would not. */
    public baseUrl = '/api'

    public get name(): string {
        return 'showcase-service'
    }

    public get initialized(): boolean {
        return this.__initialized
    }

    public async postConstruct(): Promise<void> {
        this.__initialized = true
        LOG.info('Initialized')
    }

    public async preDestroy(): Promise<void> {
        this.__initialized = false
    }

    // ========== SESSION ==========

    public async fetchSession(): Promise<Session | undefined> {
        const response = await fetch(`${this.baseUrl}/session`)
        if (response.status === 401) {
            return undefined
        }
        return (await this.answer(response)) as Session
    }

    public async signIn(name: string): Promise<Session> {
        return (await this.send('POST', '/session', { name })) as Session
    }

    public async signOut(): Promise<void> {
        await this.send('DELETE', '/session')
    }

    // ========== PROJECTS ==========

    public async fetchProjects(): Promise<Project[]> {
        return (await this.get('/projects')) as Project[]
    }

    public async fetchProject(projectId: Id): Promise<Project | undefined> {
        return (await this.get(`/projects/${projectId}`, true)) as Project | undefined
    }

    // ========== ISSUES ==========

    public async fetchIssues(projectId: Id, query: IssueQuery): Promise<Page<Issue>> {
        return (await this.get(`/projects/${projectId}/issues${queryString(query)}`)) as Page<Issue>
    }

    public async fetchIssue(issueId: Id): Promise<Issue | undefined> {
        return (await this.get(`/issues/${issueId}`, true)) as Issue | undefined
    }

    public async updateIssue(issueId: Id, changes: Partial<Issue>): Promise<Issue> {
        return (await this.send('PATCH', `/issues/${issueId}`, changes)) as Issue
    }

    // ========== PEOPLE AND CYCLES ==========

    public async fetchMembers(): Promise<Member[]> {
        return (await this.get('/members')) as Member[]
    }

    public async fetchCycles(projectId: Id): Promise<Cycle[]> {
        return (await this.get(`/projects/${projectId}/cycles`)) as Cycle[]
    }

    // ========== PLUMBING ==========

    private async get(path: string, allowMissing = false): Promise<unknown> {
        const response = await fetch(`${this.baseUrl}${path}`)
        if (allowMissing && response.status === 404) {
            return undefined
        }
        return this.answer(response)
    }

    private async send(method: string, path: string, body?: unknown): Promise<unknown> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: body ? { 'content-type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        })
        return this.answer(response)
    }

    private async answer(response: Response): Promise<unknown> {
        if (!response.ok) {
            // The message is the server's when it offered one: a presenter shows
            // what went wrong, and "500" is not what went wrong.
            const detail = await response.text()
            throw new Error(detail || `${response.status} ${response.statusText}`)
        }
        return response.status === 204 ? undefined : response.json()
    }
}

function queryString(query: IssueQuery): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') {
            params.set(key, String(value))
        }
    }
    const text = params.toString()
    return text ? `?${text}` : ''
}
