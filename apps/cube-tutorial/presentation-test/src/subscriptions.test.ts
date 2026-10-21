import { afterEach, describe, expect, it, vi } from 'vitest'

import { TutorialService } from 'wdc-cube-tutorial-presentation'
import { BodyScope } from 'wdc-cube-tutorial-presentation/main'
import { SubscriptionsDetailScope, SubscriptionsScope } from 'wdc-cube-tutorial-presentation/subscriptions'

import { holdCalls, startTutorial, type Harness } from './harness'

let harness: Harness | undefined

afterEach(() => {
    harness?.release()
    harness = undefined
})

const listOf = (h: Harness) => h.scope.body as SubscriptionsScope
const dialogOf = (h: Harness) => h.scope.dialog as SubscriptionsDetailScope | undefined

describe('subscriptions', () => {
    it('lists the sites the service offers', async () => {
        harness = await startTutorial('/subscriptions')

        expect(listOf(harness).sites.map((site) => site.site)).toEqual(['youtube.com', 'twitter.com', 'gettr.com'])
    })

    it('opens the dialog for the site clicked, naming it in the address', async () => {
        harness = await startTutorial('/subscriptions')

        await listOf(harness).onItemClicked(listOf(harness).sites[1])
        await harness.settle()

        expect(dialogOf(harness)).toBeInstanceOf(SubscriptionsDetailScope)
        expect(harness.history.token).toEqual('/subscriptions/detail?sd-site=2')
    })

    it('rebuilds the dialog from the address alone', async () => {
        harness = await startTutorial('/subscriptions/detail?sd-site=3')

        expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
        expect(dialogOf(harness)).toBeInstanceOf(SubscriptionsDetailScope)
        expect(dialogOf(harness)?.site).toEqual('gettr.com')
    })

    // Regression. The site name used to be published as `email`, which every
    // view read for its message and one of them also bound to the field — so the
    // dialog opened holding a domain name that its own validation then rejected.
    it('opens with the e-mail field empty', async () => {
        harness = await startTutorial('/subscriptions/detail?sd-site=3')

        expect(dialogOf(harness)?.email).toBeFalsy()
    })

    describe('closing', () => {
        it('returns to the list when the dialog was opened from it', async () => {
            harness = await startTutorial('/subscriptions')
            await listOf(harness).onItemClicked(listOf(harness).sites[1])
            await harness.settle()

            await dialogOf(harness)?.onClose()
            await harness.settle()

            expect(dialogOf(harness)).toBeUndefined()
            expect(harness.history.token).toEqual('/subscriptions')
        })

        // Regression. Nothing has been visited yet on a cold start, and the
        // presenter used to read lastPlace — which falls back to the root place —
        // as somewhere the user had been, so Cancel left the module for Home.
        it('returns to the list when the dialog was opened by address', async () => {
            harness = await startTutorial('/subscriptions/detail?sd-site=2')

            await dialogOf(harness)?.onClose()
            await harness.settle()

            expect(dialogOf(harness)).toBeUndefined()
            expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
            expect(harness.history.token).toEqual('/subscriptions')
        })

        it('returns to the list after subscribing from a cold start', async () => {
            harness = await startTutorial('/subscriptions/detail?sd-site=2')

            dialogOf(harness)?.onEmailChanged('someone@example.com')
            await dialogOf(harness)?.onSubscribe()
            await harness.settle()

            expect(dialogOf(harness)).toBeUndefined()
            expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
        })
    })

    describe('validation', () => {
        it('refuses an empty address and keeps the dialog open', async () => {
            harness = await startTutorial('/subscriptions/detail?sd-site=2')

            dialogOf(harness)?.onEmailChanged('   ')
            await dialogOf(harness)?.onSubscribe()
            await harness.settle()

            expect(harness.scope.alert?.severity).toEqual('warning')
            expect(harness.scope.alert?.title).toEqual('Field required')
            expect(dialogOf(harness)).toBeDefined()
        })

        it('refuses a malformed address and keeps the dialog open', async () => {
            harness = await startTutorial('/subscriptions/detail?sd-site=2')

            dialogOf(harness)?.onEmailChanged('not-an-address')
            await dialogOf(harness)?.onSubscribe()
            await harness.settle()

            expect(harness.scope.alert?.title).toEqual('Wrong value')
            expect(dialogOf(harness)).toBeDefined()
        })

        it('leaves the module reachable after the alert is dismissed', async () => {
            harness = await startTutorial('/subscriptions/detail?sd-site=2')
            dialogOf(harness)?.onEmailChanged('')
            await dialogOf(harness)?.onSubscribe()
            await harness.settle()

            await harness.scope.alert?.onClose()
            await harness.settle()

            expect(harness.scope.alert).toBeUndefined()
            expect(dialogOf(harness)).toBeDefined()

            await harness.scope.onHome()
            await harness.settle()
            expect(harness.scope.body).toBeInstanceOf(BodyScope)
        })
    })

    describe('an address the dialog cannot use', () => {
        // The keys refuse an id that cannot name a site, and the dialog redirects to the
        // list in the middle of the flip instead of failing it, which used to leave the
        // module for Home.
        for (const site of ['abc', '-3', '2.5']) {
            it(`lands on the list for sd-site=${site}`, async () => {
                harness = await startTutorial(`/subscriptions/detail?sd-site=${site}`)

                expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
                expect(dialogOf(harness)).toBeUndefined()
                expect(harness.history.token).toEqual('/subscriptions')
            })
        }

        // A well-formed id the service does not know is only found out once the site is
        // fetched, after the dialog is already up: it says so and closes.
        it('closes on a site the service does not know, and says why', async () => {
            harness = await startTutorial('/subscriptions/detail?sd-site=999')

            await vi.waitFor(() => expect(dialogOf(harness!)).toBeUndefined())
            expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
            expect(harness.scope.alert?.title).toEqual('Unknown site')
            expect(harness.history.token).toEqual('/subscriptions')
        })
    })

    describe('while a request is out', () => {
        it('shows the list before the sites arrive', async () => {
            harness = await startTutorial()
            const held = holdCalls(TutorialService.INSTANCE, 'fetchSubscribleSites')

            try {
                const opening = harness.scope.onOpenSuscriptions()
                await vi.waitFor(() => expect(harness?.scope.body).toBeInstanceOf(SubscriptionsScope))

                held.releaseAll()
                await opening
                await harness.settle()
                expect(listOf(harness).sites.length).toEqual(3)
            } finally {
                held.restore()
            }
        })

        it('shows the dialog before the site arrives', async () => {
            harness = await startTutorial('/subscriptions')
            const held = holdCalls(TutorialService.INSTANCE, 'fetchSiteItem')

            try {
                const opening = harness.app.flipToIntentString('/subscriptions/detail?sd-site=2')
                await vi.waitFor(() => expect(dialogOf(harness!)).toBeInstanceOf(SubscriptionsDetailScope))
                expect(dialogOf(harness)?.site).toBeUndefined()

                held.releaseAll()
                await opening
                await harness.settle()
                expect(dialogOf(harness)?.site).toEqual('twitter.com')
                expect(harness.history.token).toEqual('/subscriptions/detail?sd-site=2')
            } finally {
                held.restore()
            }
        })

        // Two sites asked for in quick succession, answered out of order: the one asked
        // for last wins, whichever response arrives last.
        it('keeps the site asked for last when responses cross', async () => {
            harness = await startTutorial('/subscriptions/detail?sd-site=1')
            const held = holdCalls(TutorialService.INSTANCE, 'fetchSiteItem')

            try {
                await harness.app.flipToIntentString('/subscriptions/detail?sd-site=2')
                await harness.app.flipToIntentString('/subscriptions/detail?sd-site=3')
                expect(held.calls.map((call) => call.args[0])).toEqual([2, 3])

                held.calls[1].release()
                await harness.settle()
                held.calls[0].release()
                await harness.settle()

                expect(dialogOf(harness)?.site).toEqual('gettr.com')
                expect(harness.history.token).toEqual('/subscriptions/detail?sd-site=3')
            } finally {
                held.restore()
            }
        })
    })
})
