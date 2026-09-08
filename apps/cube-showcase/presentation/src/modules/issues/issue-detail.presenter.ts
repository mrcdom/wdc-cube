import { CubePresenter, FlipIntent, Logger, NOOP_VOID, ScopeSlot } from 'wdc-cube'

import { PRIORITY_LABELS, STATE_LABELS, type Issue, type IssuePriority, type IssueState } from '../../domain'
import { ShowcaseService } from '../../services'
import type { MainPresenter } from '../main/main.presenter'
import { IssueDetailKeys } from './issue-detail.key'
import { IssueDetailScope } from './issue-detail.scope'
import { IssuesKeys } from './issues.key'

const LOG = Logger.get('Showcase.IssueDetailPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

/**
 * One issue, shown over the list it came from.
 *
 * A dialog with a place of its own, which is the point: the URL names the open
 * issue, so a link opens straight into it, a reload leaves it open, and Back
 * closes it. The list underneath is still the place it was — nothing about it
 * was unmade to put this on top.
 */
export class IssueDetailPresenter extends CubePresenter<MainPresenter, IssueDetailScope> {
    private dialogSlot: ScopeSlot = NOOP_VOID
    private previousIntent?: FlipIntent
    private issue?: Issue
    private projectId?: string

    public constructor(app: MainPresenter) {
        super(app, new IssueDetailScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        const keys = new IssueDetailKeys(this.app, intent)

        if (initialization) {
            // Only somewhere the reader has actually been. On a cold start
            // straight into this dialog, there is nowhere to return to and
            // `close` falls back to the list.
            if (this.app.hasNavigated) {
                this.previousIntent = this.app.newFlipIntent(this.app.lastPlace)
            }

            this.dialogSlot = keys.dialogSlot
            this.projectId = keys.projectId

            this.scope.onClose = this.action(this.onClose)
            this.scope.onChangeState = this.action(this.onChangeState) as unknown as (value: string) => void
            this.scope.onChangePriority = this.action(this.onChangePriority) as unknown as (value: string) => void

            // Handed over by the list, or fetched when the reader arrived by URL.
            await this.load(keys)

            LOG.info('Initialized')
        }

        this.dialogSlot(this.scope)
        return true
    }

    /**
     * What the address bar says while this dialog is open.
     *
     * Only the issue: the list beneath publishes its own filters and page at the
     * same moment, and the project comes from the place both stand inside. The
     * URL carries all three without any of them being written twice.
     */
    public override publishParameters(intent: FlipIntent): void {
        const keys = new IssueDetailKeys(this.app, intent)
        keys.issueId = this.issue?.id
    }

    private async load(keys: IssueDetailKeys) {
        const given = keys.issue
        if (given) {
            this.apply(given)
            return
        }

        if (!keys.issueId) {
            this.scope.error = 'No issue was named.'
            this.scope.loading = false
            return
        }

        try {
            const issue = await service.fetchIssue(keys.issueId)
            if (issue) {
                this.apply(issue)
            } else {
                this.scope.error = 'That issue no longer exists.'
                this.scope.loading = false
            }
        } catch (caught) {
            this.scope.error = caught instanceof Error ? caught.message : 'Could not load the issue.'
            this.scope.loading = false
        }
    }

    private apply(issue: Issue) {
        this.issue = issue
        this.scope.reference = issue.reference
        this.scope.title = issue.title
        this.scope.description = issue.description
        this.scope.state = issue.state
        this.scope.priority = issue.priority
        this.scope.labels = issue.labels
        this.scope.updatedAt = issue.updatedAt
        this.scope.loading = false
        this.scope.error = undefined
    }

    protected async onChangeState(value: string) {
        await this.save({ state: value as IssueState })
    }

    protected async onChangePriority(value: string) {
        await this.save({ priority: value as IssuePriority })
    }

    private async save(changes: Partial<Issue>) {
        if (!this.issue) {
            return
        }

        this.scope.saving = true

        try {
            this.apply(await service.updateIssue(this.issue.id, changes))
            const what = changes.state ? STATE_LABELS[changes.state] : PRIORITY_LABELS[changes.priority!]
            this.app.alert('success', 'Saved', `${this.scope.reference} is now ${what}.`)
        } catch (caught) {
            this.app.unexpected('Saving the issue', caught)
        } finally {
            this.scope.saving = false
        }
    }

    protected async onClose() {
        if (this.previousIntent) {
            await this.app.flipToIntent(this.previousIntent)
            return
        }

        const target = new IssuesKeys(this.app)
        target.projectId = this.projectId
        await target.flip()
    }
}
