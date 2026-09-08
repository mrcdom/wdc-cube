import { afterEach, describe, expect, it } from 'vitest'

import { BodyScope } from 'wdc-cube-tutorial-core/main'
import { SubscriptionsDetailScope, SubscriptionsScope } from 'wdc-cube-tutorial-core/subscriptions'

import { startTutorial, type Harness } from './harness'

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
        expect(harness.history.token).toEqual('/subscriptions/detail?site-id=2')
    })

    it('rebuilds the dialog from the address alone', async () => {
        harness = await startTutorial('/subscriptions/detail?site-id=3')

        expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
        expect(dialogOf(harness)).toBeInstanceOf(SubscriptionsDetailScope)
        expect(dialogOf(harness)?.site).toEqual('gettr.com')
    })

    // Regression. The site name used to be published as `email`, which every
    // view read for its message and one of them also bound to the field — so the
    // dialog opened holding a domain name that its own validation then rejected.
    it('opens with the e-mail field empty', async () => {
        harness = await startTutorial('/subscriptions/detail?site-id=3')

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
            harness = await startTutorial('/subscriptions/detail?site-id=2')

            await dialogOf(harness)?.onClose()
            await harness.settle()

            expect(dialogOf(harness)).toBeUndefined()
            expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
            expect(harness.history.token).toEqual('/subscriptions')
        })

        it('returns to the list after subscribing from a cold start', async () => {
            harness = await startTutorial('/subscriptions/detail?site-id=2')

            dialogOf(harness)?.onEmailChanged('someone@example.com')
            await dialogOf(harness)?.onSubscribe()
            await harness.settle()

            expect(dialogOf(harness)).toBeUndefined()
            expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
        })
    })

    describe('validation', () => {
        it('refuses an empty address and keeps the dialog open', async () => {
            harness = await startTutorial('/subscriptions/detail?site-id=2')

            dialogOf(harness)?.onEmailChanged('   ')
            await dialogOf(harness)?.onSubscribe()
            await harness.settle()

            expect(harness.scope.alert?.severity).toEqual('warning')
            expect(harness.scope.alert?.title).toEqual('Field required')
            expect(dialogOf(harness)).toBeDefined()
        })

        it('refuses a malformed address and keeps the dialog open', async () => {
            harness = await startTutorial('/subscriptions/detail?site-id=2')

            dialogOf(harness)?.onEmailChanged('not-an-address')
            await dialogOf(harness)?.onSubscribe()
            await harness.settle()

            expect(harness.scope.alert?.title).toEqual('Wrong value')
            expect(dialogOf(harness)).toBeDefined()
        })

        it('leaves the module reachable after the alert is dismissed', async () => {
            harness = await startTutorial('/subscriptions/detail?site-id=2')
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
})
