import { settle, TestHistoryManager } from 'wdc-cube-test'
import { initializeRoutes, Places, registerServices } from 'wdc-cube-tutorial-core'
import { MainPresenter, type MainScope } from 'wdc-cube-tutorial-core/main'

let bootstrapped = false

/**
 * Services and routes are registered into module-level singletons, so this runs
 * once for the whole suite rather than once per application.
 */
function bootstrapOnce() {
    if (!bootstrapped) {
        registerServices()
        initializeRoutes()
        bootstrapped = true
    }
}

export type UnexpectedError = { message: string; error: unknown }

export type Harness = {
    readonly app: MainPresenter
    readonly scope: MainScope
    readonly history: TestHistoryManager
    /**
     * Runs pending updates, then fails if the presentation layer reported an
     * error. An action swallows what it throws — it reports through `unexpected`
     * and returns — so without this a test reads a scope that quietly never
     * changed and passes.
     */
    settle: () => Promise<void>
    /** Hands back the errors reported so far and forgets them. */
    takeErrors: () => UnexpectedError[]
    release: () => void
}

/**
 * Starts the tutorial at `location`, exactly as a browser landing on that
 * address would — including landing straight on a dialog, which is where the
 * interesting cases live.
 *
 * There is no view here, and that is the point: the presentation layer knows
 * nothing about one, so everything it does can be stated in terms of the scope
 * tree it publishes and the tokens it pushes to history.
 */
export async function startTutorial(location = ''): Promise<Harness> {
    bootstrapOnce()

    const history = new TestHistoryManager(location)
    const app = new MainPresenter(history)

    // Every presenter routes `unexpected` up to the application, so wrapping it
    // here catches whatever any of them reports.
    const errors: UnexpectedError[] = []
    const reportUnexpected = app.unexpected.bind(app)
    app.unexpected = (message: string, error: unknown) => {
        errors.push({ message, error })
        reportUnexpected(message, error)
    }

    const takeErrors = () => errors.splice(0, errors.length)

    const settleAndCheck = async () => {
        await settle()

        if (errors.length > 0) {
            const [first] = takeErrors()
            throw new Error(`The presentation layer reported an error: ${first.message}`, { cause: first.error })
        }
    }

    // kickStart rather than initialize(): initialize() launches the bootstrap
    // without returning it, which is right for a view that will be told when the
    // scope changes, and useless to a test that has to await the boot.
    await app.kickStart(Places.main)
    await settleAndCheck()

    return {
        app,
        get scope() {
            return app.scope
        },
        history,
        settle: settleAndCheck,
        takeErrors,
        release: () => app.release()
    }
}
