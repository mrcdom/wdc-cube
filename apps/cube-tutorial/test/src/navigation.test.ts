import { afterEach, describe, expect, it } from 'vitest'

import { BodyScope } from 'wdc-cube-tutorial-app/main'
import { SubscriptionsScope } from 'wdc-cube-tutorial-app/subscriptions'
import { TodoMvcScope } from 'wdc-cube-tutorial-app/todo-mvc'

import { startTutorial, type Harness } from './harness'

let harness: Harness | undefined

afterEach(() => {
    harness?.release()
    harness = undefined
})

describe('navigation', () => {
    it('lands on the home body when started with no address', async () => {
        harness = await startTutorial()

        expect(harness.scope.body).toBeInstanceOf(BodyScope)
        // Nothing is published for the root: kickStart applies the root place's
        // parameters directly rather than flipping to it, which is why opening
        // the app leaves the address bare instead of naming a place.
        expect(harness.history.tokens).toEqual([])
    })

    it('puts the module a nav action asks for into the body slot', async () => {
        harness = await startTutorial()

        await harness.scope.onOpenTodos()
        await harness.settle()
        expect(harness.scope.body).toBeInstanceOf(TodoMvcScope)

        await harness.scope.onOpenSuscriptions()
        await harness.settle()
        expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)

        await harness.scope.onHome()
        await harness.settle()
        expect(harness.scope.body).toBeInstanceOf(BodyScope)
    })

    it('starts inside a module when the address names one', async () => {
        harness = await startTutorial('/todos')

        expect(harness.scope.body).toBeInstanceOf(TodoMvcScope)
    })

    it('publishes a token for each place it passes through', async () => {
        harness = await startTutorial()
        harness.history.clearTokens()

        await harness.scope.onOpenTodos()
        await harness.settle()
        await harness.scope.onOpenSuscriptions()
        await harness.settle()

        expect(harness.history.tokens).toEqual(['/todos', '/subscriptions'])
    })

    it('swaps the body scope rather than keeping both modules alive', async () => {
        harness = await startTutorial('/todos')
        const todos = harness.scope.body

        await harness.scope.onOpenSuscriptions()
        await harness.settle()

        expect(harness.scope.body).not.toBe(todos)
        expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
    })
})

describe('alerts', () => {
    it('raises an alert carrying the severity asked for, and clears it on close', async () => {
        harness = await startTutorial()
        const body = harness.scope.body as BodyScope

        await body.onOpenAlert('warning')
        await harness.settle()

        expect(harness.scope.alert).toBeDefined()
        expect(harness.scope.alert?.severity).toEqual('warning')
        expect(harness.scope.alert?.title).toEqual('Some title')

        await harness.scope.alert?.onClose()
        await harness.settle()

        expect(harness.scope.alert).toBeUndefined()
    })

    it('reports an unimplemented action as an alert rather than navigating', async () => {
        harness = await startTutorial()

        await harness.scope.onLogin()
        await harness.settle()

        expect(harness.scope.alert?.severity).toEqual('info')
        expect(harness.scope.body).toBeInstanceOf(BodyScope)
    })
})
