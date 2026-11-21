import { describe, expect, it } from 'vitest'

import { Place } from './Place.js'
import { FlipIntent } from './FlipIntent.js'
import { HistoryManager } from './HistoryManager.js'
import { Application } from './Application.js'
import { ApplicationPresenter } from './ApplicationPresenter.js'
import { CubePresenter } from './CubePresenter.js'
import { CallbackManager } from './CallbackManager.js'
import { ScopeUpdateManager } from './Presenter.js'
import { Scope } from './Scope.js'

/**
 * Regressions for the defects found while porting the framework to C#. Each
 * block names the behaviour it pins, not the bug, so it still reads right once
 * the bug is history.
 */

class MemoryHistory extends HistoryManager {
    public current = ''
    public readonly published: string[] = []

    public override get location() {
        return this.current
    }

    public override update(app: Application, place: Place): void {
        this.current = app.newFlipIntent(place).toString()
        this.published.push(this.current)
    }

    /** What a browser does on Back, Forward or an edited address. */
    public navigate(location: string) {
        this.current = location
        this.notifyChanges()
    }
}

function deferred() {
    let resolve!: () => void
    const promise = new Promise<void>((r) => (resolve = r))
    return { promise, resolve }
}

async function until(condition: () => boolean, rounds = 50) {
    for (let i = 0; i < rounds && !condition(); i++) {
        await new Promise((r) => setTimeout(r, 0))
    }
}

// :: A small cube
//
// root ─┬─ hub ── leaf
//       ├─ slow
//       ├─ jump      (flips to hub from inside its own presenter)
//       └─ broken    (fails on the way in)

const Places = {
    ROOT: Place.UNKNOWN,
    HUB: Place.UNKNOWN,
    LEAF: Place.UNKNOWN,
    SLOW: Place.UNKNOWN,
    JUMP: Place.UNKNOWN,
    BROKEN: Place.UNKNOWN
}

class TestApp extends Application {
    /** Set by a test to hold the slow place open. */
    public gate?: Promise<void>

    /** Whether the hub stops the composition, returning false without redirecting. */
    public hubStops = false

    /** What the jump presenter saw right after `await this.flip(hub)`. */
    public seenAfterFlip?: Place

    /** Set by a test to slow down the restoration of the root during a rollback. */
    public slowRestore = false
    public restored = false

    constructor() {
        super(Places.ROOT, new MemoryHistory())
        this.setPlaces(Places)
    }

    get history() {
        return this.historyManager as MemoryHistory
    }
}

class RootPresenter extends CubePresenter<TestApp, Scope> {
    constructor(app: TestApp) {
        super(app, new Scope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        // Only a rollback applies the hub's intent to the root after the broken
        // attempt: that is the restoration being timed.
        if (!initialization && this.app.slowRestore && intent.place === Places.HUB) {
            await new Promise((r) => setTimeout(r, 5))
            this.app.restored = true
        }
        return true
    }
}

class HubPresenter extends CubePresenter<TestApp, Scope> {
    constructor(app: TestApp) {
        super(app, new Scope())
    }

    public override async applyParameters(): Promise<boolean> {
        return !this.app.hubStops
    }
}

class LeafPresenter extends CubePresenter<TestApp, Scope> {
    public static created = 0

    constructor(app: TestApp) {
        super(app, new Scope())
        LeafPresenter.created++
    }
}

class SlowPresenter extends CubePresenter<TestApp, Scope> {
    constructor(app: TestApp) {
        super(app, new Scope())
    }

    public override async applyParameters(): Promise<boolean> {
        await this.app.gate
        return true
    }
}

class JumpPresenter extends CubePresenter<TestApp, Scope> {
    constructor(app: TestApp) {
        super(app, new Scope())
    }

    public async go(place: Place) {
        await this.flip(place)
        this.app.seenAfterFlip = this.app.lastPlace
    }
}

class BrokenPresenter extends CubePresenter<TestApp, Scope> {
    constructor(app: TestApp) {
        super(app, new Scope())
    }

    public override async applyParameters(): Promise<boolean> {
        await Promise.resolve()
        throw new Error('broken on the way in')
    }
}

{
    const place = Place.create
    Places.ROOT = place('root', RootPresenter)
    Places.HUB = place('hub', HubPresenter, Places.ROOT)
    Places.LEAF = place('leaf', LeafPresenter, Places.HUB)
    Places.SLOW = place('slow', SlowPresenter, Places.ROOT)
    Places.JUMP = place('jump', JumpPresenter, Places.ROOT)
    Places.BROKEN = place('broken', BrokenPresenter, Places.ROOT)
}

describe('CubePresenter.flip', () => {
    it('resolves once the navigation it asked for has landed', async () => {
        const app = new TestApp()
        await app.flip(Places.JUMP)
        const jump = app.getPresenter(Places.JUMP) as JumpPresenter

        await jump.go(Places.HUB)

        expect(app.seenAfterFlip).toBe(Places.HUB)
    })

    it('hands a failed navigation back to whoever asked for it', async () => {
        const app = new TestApp()
        await app.flip(Places.JUMP)
        const jump = app.getPresenter(Places.JUMP) as JumpPresenter

        await expect(jump.flip(Places.BROKEN)).rejects.toThrow('broken on the way in')
        expect(app.lastPlace).toBe(Places.JUMP)
    })
})

describe('rollback', () => {
    it('has restored the source presenters by the time the flip rejects', async () => {
        const app = new TestApp()
        await app.flip(Places.HUB)
        app.slowRestore = true

        await expect(app.flip(Places.BROKEN)).rejects.toThrow()

        expect(app.restored).toBe(true)
        expect(app.lastPlace).toBe(Places.HUB)
        expect(app.getPresenter(Places.BROKEN)).toBeUndefined()
    })
})

describe('a presenter that stops the composition', () => {
    it('becomes the current place, and nothing below it is built', async () => {
        const app = new TestApp()
        app.hubStops = true
        const created = LeafPresenter.created

        await app.flip(Places.LEAF)

        expect(LeafPresenter.created).toBe(created)
        expect(app.lastPlace).toBe(Places.HUB)
        expect(app.getPresenter(Places.HUB)).toBeDefined()
        expect(app.history.current).toBe('hub')
    })
})

describe('history moving during a flip', () => {
    it('goes where the user went once the running flip lands', async () => {
        const app = new TestApp()
        await app.flip(Places.HUB)

        const gate = deferred()
        app.gate = gate.promise
        const running = app.flip(Places.SLOW)

        // Back, pressed while the slow place is still loading
        app.history.navigate('leaf')

        gate.resolve()
        await running
        await until(() => app.lastPlace === Places.LEAF)

        expect(app.lastPlace).toBe(Places.LEAF)
        expect(app.history.current).toBe('leaf')
        // The slow place's address was never written over the user's move
        expect(app.history.published).not.toContain('slow')
    })

    it('drops the move when the running flip fails', async () => {
        const app = new TestApp()
        await app.flip(Places.HUB)

        const running = app.flip(Places.BROKEN)
        app.history.navigate('leaf')

        await expect(running).rejects.toThrow()
        await until(() => false, 5)

        expect(app.lastPlace).toBe(Places.HUB)
        expect(app.history.current).toBe('hub')
    })
})

describe('the empty address', () => {
    it('is the root, not wherever the user was', async () => {
        const app = new TestApp()
        await app.flip(Places.LEAF)

        app.history.navigate('')
        await until(() => app.lastPlace === Places.ROOT)

        expect(app.lastPlace).toBe(Places.ROOT)
    })

    it('still leaves an unknown place name where the user is', async () => {
        const app = new TestApp()
        await app.flip(Places.HUB)

        await app.flipToIntentString('no-such-place')

        expect(app.lastPlace).toBe(Places.HUB)
    })
})

describe('Place ids', () => {
    it('grow in creation order, so a child always outranks its parent', () => {
        expect(Places.HUB.id).toBeGreaterThan(Places.ROOT.id)
        expect(Places.LEAF.id).toBeGreaterThan(Places.HUB.id)
        expect(Places.SLOW.id).toBeGreaterThan(Places.LEAF.id)
    })
})

// :: kickStart

const KickPlaces = {
    SAFE: Place.UNKNOWN,
    TARGET: Place.UNKNOWN
}

class KickApp extends ApplicationPresenter<Scope> {
    constructor(location: string) {
        const history = new MemoryHistory()
        history.current = location
        super(history, new Scope())
        this.setPlaces(KickPlaces)
    }
}

/** Fails whenever the address carries `bad`, like a link to a record that is gone. */
class PickyPresenter extends CubePresenter<KickApp, Scope> {
    constructor(app: KickApp) {
        super(app, new Scope())
    }

    public override async applyParameters(intent: FlipIntent): Promise<boolean> {
        if (intent.getParameterRawValue('bad') !== undefined) {
            throw new Error('no such record')
        }
        return true
    }
}

{
    KickPlaces.SAFE = Place.create('safe', PickyPresenter)
    KickPlaces.TARGET = Place.create('target', PickyPresenter)
}

describe('ApplicationPresenter.kickStart', () => {
    it('opens the safe place without the parameters that broke the address', async () => {
        const app = new KickApp('target?bad=1')

        await app.kickStart(KickPlaces.SAFE)

        expect(app.lastPlace).toBe(KickPlaces.SAFE)
        expect((app.historyManager as MemoryHistory).current).toBe('safe')
    })
})

// :: Scope updates

describe('an update asked for while a view redraws', () => {
    class RootScope extends Scope {}
    class ChildScope extends Scope {}

    it('is drawn in the next round instead of being lost', () => {
        const callbacks = CallbackManager.singleton()
        callbacks.flush() // whatever earlier tests left queued
        const root = new RootScope()
        const child = new ChildScope()
        const manager = new ScopeUpdateManager(root)

        let childRedraws = 0
        let rootRedraws = 0
        child.forceUpdate = () => childRedraws++
        // A view that redraws synchronously and, while doing so, changes a scope
        root.forceUpdate = () => {
            if (rootRedraws++ === 0) {
                manager.update(child)
            }
        }

        manager.update()
        callbacks.flush()

        expect(rootRedraws).toBe(1)
        expect(childRedraws).toBe(0)
        expect(callbacks.hasPendingCallbacks).toBe(true)

        callbacks.flush()

        expect(childRedraws).toBe(1)
        expect(callbacks.hasPendingCallbacks).toBe(false)
        manager.release()
    })

    it('from onBeforeScopeUpdate still joins the flush under way', () => {
        const callbacks = CallbackManager.singleton()
        callbacks.flush() // whatever earlier tests left queued
        const root = new RootScope()
        const child = new ChildScope()
        const manager = new ScopeUpdateManager(root)

        let childRedraws = 0
        child.forceUpdate = () => childRedraws++
        root.forceUpdate = () => void 0
        manager.addOnBeforeScopeUpdateListener(() => manager.update(child))

        manager.update()
        callbacks.flush()

        expect(childRedraws).toBe(1)
        expect(callbacks.hasPendingCallbacks).toBe(false)
        manager.release()
    })
})
