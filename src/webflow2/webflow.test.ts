import { CastUtils } from './CastUtils'
import { WebFlowStep } from './WebFlowStep'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowHistoryManager } from './WebFlowHistoryManager'
import { WebFlowApplication, NavigationContext } from './WebFlowApplication'
import { WebFlowPresenter } from './WebFlowPresenter'
import { WebFlowScope } from './WebFlowScope'
import { WebFlowScopeSlot } from './WebFlowScopeSlot'

it('CastUtils.isArray', () => {
    expect(CastUtils.isArray(undefined)).toEqual(false)
    expect(CastUtils.isArray(null)).toEqual(false)
    expect(CastUtils.isArray(0)).toEqual(false)
    expect(CastUtils.isArray(true)).toEqual(false)
    expect(CastUtils.isArray('abc')).toEqual(false)
    expect(CastUtils.isArray([])).toEqual(true)
})

it('WebFlowPlace.toString  :: Simple Value', () => {
    const place = new WebFlowPlace(new WebFlowStep(0, 'root'))
    place.setParameter('p0', 1)
    place.setParameter('p1', 1.1)
    place.setParameter('p2', true)
    place.setParameter('p3', 'a b c')

    expect(place.toString()).toEqual('root?p0=1&p1=1.1&p2=true&p3=a+b+c')
})

it('WebFlowPlace.parse :: Simple Value', () => {
    const expected = 'root?p0=1&p1=1.1&p2=true&p3=a+b+c'
    const place = WebFlowPlace.parse(expected)
    expect(place.toString()).toEqual(expected)
})

it('WebFlowPlace.toString :: Multiple Values', () => {
    const place = new WebFlowPlace(new WebFlowStep(0, 'root'))
    place.setParameter('p0', [1, 2])
    place.setParameter('p1', [1.1, 2.2])
    place.setParameter('p2', [true, false])
    place.setParameter('p3', ['a', 'b', 'c'])

    expect(place.toString()).toEqual('root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c')
})

it('WebFlowPlace.parse :: Multiple Values', () => {
    const expected = 'root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c'
    const place = WebFlowPlace.parse(expected)
    expect(place.toString()).toEqual(expected)
})

const NO_ACTION = async () => {
    // NOOP
}

const NOOP_FN = () => {
    // NOOP
}

async function echoService<T>(v: T): Promise<T> {
    return v
}

const PARAM_IDs = {
    SESSION_ID: 's',
    USER_ID: 'u',
    CART_ID: 'c',
    PRODUCT_ID: 'p',
    RECEIPT_ID: 'r'
}

const ATTR_IDs = {
    PARENT: 'parent'
}

class TestHistoryManager extends WebFlowHistoryManager {

    public token = ''

    public override update(token: string) {
        this.token = token
    }

}

const Places = {
    // Level 0
    ROOT: new WebFlowStep(0, 'root'),

    // Level 1
    LOGIN: new WebFlowStep(1, 'login'),
    RESTRICTED: new WebFlowStep(2, 'restricted'),

    // Level 2
    CART: new WebFlowStep(3, 'cart'),
    PRODUCT: new WebFlowStep(4, 'product'),
    RECEIPT: new WebFlowStep(5, 'receipt'),
}

class TestApplication extends WebFlowApplication {

    public session = {
        id: 0,
        active: false
    }

    constructor() {
        super(Places.ROOT, new TestHistoryManager())
    }

}

// :: Root

class RootScope extends WebFlowScope {
    computedValue = 0
    body?: WebFlowScope
}

class RootPresenter extends WebFlowPresenter<TestApplication, RootScope> {

    public initialized = false
    public deepest = false

    private bodySlot: WebFlowScopeSlot = this.setBody.bind(this)

    constructor(app: TestApplication) {
        super(app, new RootScope('v-root'))
    }

    private setBody(scope?: WebFlowScope) {
        if (this.scope.body !== scope) {
            this.scope.body = scope
            this.scope.update()
        }
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        const urlSessionId = place.getParameterAsNumber(PARAM_IDs.SESSION_ID, this.app.session.id)
        if (initialization) {
            this.initialized = true
            this.app.session = await echoService({
                id: urlSessionId,
                active: true
            })
        }

        this.deepest = deepest

        if (deepest) {
            this.setBody(undefined)
        } else {
            place.setScopeSlot(ATTR_IDs.PARENT, this.bodySlot)
        }

        return true
    }

    public override commitComputedState(): void {
        this.scope.computedValue = this.app.session.id * 2
    }

    public override publishParameters(place: WebFlowPlace): void {
        place.setParameter(PARAM_IDs.SESSION_ID, this.app.session.id)
    }

}

// :: Login

class LoginScope extends WebFlowScope {
    userName?: string
    password?: string
    message?: string

    onEnter: () => Promise<void> = NO_ACTION
}

class LoginPresenter extends WebFlowPresenter<TestApplication, LoginScope> {

    private parentSlot: WebFlowScopeSlot

    deepest = false
    initialized = false
    urlUserId?: number

    constructor(app: TestApplication) {
        super(app, new LoginScope('v-login'))
        this.parentSlot = NOOP_FN
        this.scope.onEnter = this.onEnter.bind(this)
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        const urlUserId = place.getParameterAsNumber(PARAM_IDs.USER_ID, -1);

        if (initialization) {
            this.initialized = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
            await this.loadData(urlUserId)
        }
        // If data changed
        else if (this.urlUserId !== urlUserId) {
            await this.loadData(urlUserId)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

    public override commitComputedState(): void {
        // NOOP
    }

    public override publishParameters(place: WebFlowPlace): void {
        // NOOP
    }

    private async loadData(urlUserId: number) {
        this.scope.userName = undefined
        this.scope.password = undefined
        if (urlUserId !== -1) {
            this.scope.userName = await echoService(urlUserId + "-unknown")
            this.scope.password = undefined
        }
        this.urlUserId = urlUserId
    }

    private async onEnter() {
        try {
            await Routes.restricted(this.app)
            this.scope.message = undefined
        } catch (caught) {
            this.scope.message = caught.message
        } finally {
            this.scope.update()
        }
    }
}

// :: Restricted

class RestrictedScope extends WebFlowScope {
    message?: string

    content?: WebFlowScope

    onCart: (cartId: number) => Promise<void> = NO_ACTION
    onProduct: (productId: number) => Promise<void> = NO_ACTION
    onReceipt: (receiptId: number) => Promise<void> = NO_ACTION
}

class RestrictedPresenter extends WebFlowPresenter<TestApplication, RestrictedScope> {

    private parentSlot: WebFlowScopeSlot

    deepest = false
    initialized = false

    private contentSlot: WebFlowScopeSlot = this.setContent.bind(this)

    constructor(app: TestApplication) {
        super(app, new RestrictedScope('v-restricted'))
        this.parentSlot = NOOP_FN
        this.scope.onCart = this.onCart.bind(this)
        this.scope.onProduct = this.onProduct.bind(this)
        this.scope.onReceipt = this.onReceipt.bind(this)
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.initialized = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        if (deepest) {
            this.setContent(undefined)
        } else {
            place.setScopeSlot(ATTR_IDs.PARENT, this.contentSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(place: WebFlowPlace): void {
        // NOOP
    }

    private setContent(contentScope?: WebFlowScope) {
        if (contentScope !== this.scope.content) {
            this.scope.content = contentScope
            this.scope.update()
        }
    }

    private async onCart(cartId: number) {
        try {
            const place = this.app.newPlace()
            place.setParameter(PARAM_IDs.CART_ID, cartId)
            await Routes.cart(this.app, place)
        } catch (caught) {
            this.scope.message = caught.message
        } finally {
            this.scope.update()
        }
    }

    private async onProduct(productId: number) {
        try {
            const place = this.app.newPlace()
            place.setParameter(PARAM_IDs.PRODUCT_ID, productId)
            await Routes.product(this.app, place)
        } catch (caught) {
            this.scope.message = caught.message
        } finally {
            this.scope.update()
        }
    }

    private async onReceipt(receiptId: number) {
        try {
            const place = this.app.newPlace()
            place.setParameter(PARAM_IDs.RECEIPT_ID, receiptId)
            await Routes.cart(this.app, place)
        } catch (caught) {
            this.scope.message = caught.message
        } finally {
            this.scope.update()
        }
    }

}

// :: Cart

class CartScope extends WebFlowScope {

}

class CartPresenter extends WebFlowPresenter<TestApplication, CartScope> {

    private parentSlot: WebFlowScopeSlot

    public initialized = false
    public cartId = -1

    constructor(app: TestApplication) {
        super(app, new CartScope('v-cart'))
        this.parentSlot = NOOP_FN
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        const urlCartId = place.getParameterAsNumber(PARAM_IDs.CART_ID, this.cartId)

        if (initialization) {
            this.initialized = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
            // Simulate a remote service access
            await echoService(urlCartId)
            this.cartId = urlCartId
        } else if (this.cartId != urlCartId) {
            // Simulate a remote service access
            await echoService(urlCartId)
            this.cartId = urlCartId
        }

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(place: WebFlowPlace): void {
        if (this.cartId !== -1) {
            place.setParameter(PARAM_IDs.CART_ID, this.cartId)
        }
    }

}

// :: Product

class ProductScope extends WebFlowScope {

}

class ProductPresenter extends WebFlowPresenter<TestApplication, ProductScope> {

    private parentSlot: WebFlowScopeSlot

    public deepest = false
    public initialization = false

    constructor(app: TestApplication) {
        super(app, new ProductScope('v-product'))
        this.parentSlot = NOOP_FN
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.initialization = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

    public override commitComputedState(): void {
        // NOOP
    }

    public override publishParameters(place: WebFlowPlace): void {
        // NOOP
    }

}

// :: Receipt

class ReceiptScope extends WebFlowScope {

}

class ReceiptPresenter extends WebFlowPresenter<TestApplication, ReceiptScope> {

    private parentSlot: WebFlowScopeSlot

    public deepest = false
    public initialization = false

    constructor(app: TestApplication) {
        super(app, new ReceiptScope('v-receipt'))
        this.parentSlot = NOOP_FN
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.initialization = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

    public override commitComputedState(): void {
        // NOOP
    }

    public override publishParameters(place: WebFlowPlace): void {
        // NOOP
    }

}

// :: Routes

const Routes = {

    async login(app: TestApplication, place?: WebFlowPlace) {
        const ctx = new NavigationContext(app, place ?? app.newPlace())
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.LOGIN, true, LoginPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    },

    async restricted(app: TestApplication, place?: WebFlowPlace) {
        const ctx = new NavigationContext(app, place ?? app.newPlace())
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.RESTRICTED, true, RestrictedPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    },

    async cart(app: TestApplication, place: WebFlowPlace) {
        const ctx = new NavigationContext(app, place)
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.RESTRICTED, false, RestrictedPresenter)
            await ctx.step(Places.CART, true, CartPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    },

    async product(app: TestApplication, place: WebFlowPlace) {
        const ctx = new NavigationContext(app, place)
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.RESTRICTED, false, RestrictedPresenter)
            await ctx.step(Places.PRODUCT, true, CartPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    },

    async receipt(app: TestApplication, place: WebFlowPlace) {
        const ctx = new NavigationContext(app, place)
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.RESTRICTED, false, RestrictedPresenter)
            await ctx.step(Places.RECEIPT, true, ReceiptPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    }

}

it('Application :: login', async () => {
    const app = new TestApplication()
    await Routes.login(app);

    const root = app.getPresenter(Places.ROOT) as RootPresenter
    expect(root).toBeDefined()

    expect(app.session.id).toEqual(0)
    expect(root.initialized).toEqual(true)
    expect(root.deepest).toEqual(false)

    const login = app.getPresenter(Places.LOGIN) as LoginPresenter
    expect(login).toBeDefined()
    expect(login.initialized).toEqual(true)
    expect(login.deepest).toEqual(true)
    expect(login.scope.userName).toBeUndefined()
    expect(login.scope.password).toBeUndefined()

    expect(root.scope.body).toBe(login.scope)
})