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

    public app: TestApplication

    public token = ''

    constructor(app: TestApplication) {
        super()
        this.app = app;
    }

    public override update() {
        this.token = this.app.newPlace().toString()
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
        super()
        this._historyManager = new TestHistoryManager(this)
        this.catalogGoParser(Places.LOGIN, this.goLogin.bind(this))
        this.catalogGoParser(Places.RESTRICTED, this.goRestricted.bind(this))
        this.catalogGoParser(Places.CART, this.goCart.bind(this))
        this.catalogGoParser(Places.PRODUCT, this.goProduct.bind(this))
        this.catalogGoParser(Places.RECEIPT, this.goReceipt.bind(this))
    }

    async goLogin(place?: WebFlowPlace) {
        const ctx = new NavigationContext<TestApplication>(this, place)
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.LOGIN, true, LoginPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    }

    async goRestricted(place?: WebFlowPlace) {
        const ctx = new NavigationContext<TestApplication>(this, place)
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.RESTRICTED, true, RestrictedPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    }

    async goCart(place?: WebFlowPlace) {
        const ctx = new NavigationContext<TestApplication>(this, place)
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.RESTRICTED, false, RestrictedPresenter)
            await ctx.step(Places.CART, true, CartPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    }

    async goProduct(place?: WebFlowPlace) {
        const ctx = new NavigationContext<TestApplication>(this, place)
        try {
            await ctx.step(Places.ROOT, false, RootPresenter)
            await ctx.step(Places.RESTRICTED, false, RestrictedPresenter)
            await ctx.step(Places.PRODUCT, true, ProductPresenter)
            ctx.commit()
        } catch (caught) {
            ctx.rollback()
            throw caught
        }
    }

    async goReceipt(place?: WebFlowPlace) {
        const ctx = new NavigationContext<TestApplication>(this, place)
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
        const urlSessionId = place.getParameterAsNumberOrDefault(PARAM_IDs.SESSION_ID, this.app.session.id)
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

    public override commitComputedFields(): void {
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

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        const urlUserId = place.getParameterAsNumberOrDefault(PARAM_IDs.USER_ID, -1);

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

    public override commitComputedFields(): void {
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
            this.scope.message = undefined

            if (this.scope.userName === 'test' && this.scope.password === 'test') {
                // simulated session
                this.app.session = await echoService({
                    id: 1,
                    active: true
                })
                await this.app.goRestricted()
            } else {
                this.scope.message = 'User or password invalid'
            }
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
    onLogout: () => Promise<void> = NO_ACTION
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
        this.scope.onLogout = this.onLogout.bind(this)
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        // Safe guard agains getting into a restricted area without a session
        if (this.app.session.id === 0) {
            await this.app.goLogin()
            return false
        }

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
            await this.app.goCart(place)
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
            await this.app.goProduct(place)
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
            await this.app.goCart(place)
        } catch (caught) {
            this.scope.message = caught.message
        } finally {
            this.scope.update()
        }
    }

    private async onLogout() {
        try {
            this.app.session.id = 0
            this.app.session.active = false
            await this.app.goLogin()
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
    public cartId?: number

    public constructor(app: TestApplication) {
        super(app, new CartScope('v-cart'))
        this.parentSlot = NOOP_FN
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        const urlCartId = place.getParameterAsNumber(PARAM_IDs.CART_ID)

        if (initialization) {
            this.initialized = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
            await this.loadData(urlCartId)
        } else if (urlCartId && this.cartId != urlCartId) {
            await this.loadData(urlCartId)
        }

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(place: WebFlowPlace): void {
        place.setParameter(PARAM_IDs.CART_ID, this.cartId)
    }

    private async loadData(cartId?: number) {
        if (!cartId) {
            throw new Error('Missing cartId')
        }

        const data = await echoService({
            cartId: cartId
        })

        this.cartId = data.cartId
    }

}

// :: Product

class ProductScope extends WebFlowScope {
    name?: string
}

class ProductPresenter extends WebFlowPresenter<TestApplication, ProductScope> {

    private parentSlot: WebFlowScopeSlot

    public deepest = false
    public initialized = false
    public productId?: number

    constructor(app: TestApplication) {
        super(app, new ProductScope('v-product'))
        this.parentSlot = NOOP_FN
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        const uriProductId = place.getParameterAsNumber(PARAM_IDs.PRODUCT_ID) || this.productId
        if (initialization) {
            this.initialized = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
            await this.loadData(uriProductId)
        } else if (uriProductId && uriProductId != this.productId) {
            await this.loadData(uriProductId)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

    public override commitComputedFields(): void {
        // NOOP
    }

    public override publishParameters(place: WebFlowPlace): void {
        place.setParameter(PARAM_IDs.PRODUCT_ID, this.productId)
    }

    private async loadData(productId?: number) {
        if (!productId) {
            throw new Error('Missing productId')
        }

        const data = await echoService({
            id: productId,
            name: 'product-' + productId
        })
        this.productId = data.id
        this.scope.name = data.name
    }

}

// :: Receipt

class ReceiptScope extends WebFlowScope {

}

class ReceiptPresenter extends WebFlowPresenter<TestApplication, ReceiptScope> {

    private parentSlot: WebFlowScopeSlot

    public deepest = false
    public initialized = false

    public constructor(app: TestApplication) {
        super(app, new ReceiptScope('v-receipt'))
        this.parentSlot = NOOP_FN
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {

        if (initialization) {
            this.initialized = true
            this.parentSlot = place.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

    public override commitComputedFields(): void {
        // NOOP
    }

    public override publishParameters(place: WebFlowPlace): void {
        // NOOP
    }

}

it('Application :: Basic Navigation', async () => {
    const app = new TestApplication()
    await app.goLogin();

    // Check if presenter state was reached
    const root = app.getPresenter(Places.ROOT) as RootPresenter
    expect(root).toBeDefined()

    expect(root.initialized).toEqual(true)
    expect(root.deepest).toEqual(false)
    expect(app.session.id).toEqual(0)

    // Check if login state was reached
    let login = app.getPresenter(Places.LOGIN) as LoginPresenter
    expect(login).toBeDefined()
    expect(login.initialized).toEqual(true)
    expect(login.deepest).toEqual(true)
    expect(login.scope.userName).toBeUndefined()
    expect(login.scope.password).toBeUndefined()

    expect(root.scope.body).toBe(login.scope)

    // Check wrong password
    login.scope.userName = 'test'
    login.scope.password = 'wrong-password'
    await login.scope.onEnter()
    expect(login.scope.message).toBe('User or password invalid')
    expect(root.scope.body).toBe(login.scope)
    expect(app.session.id).toEqual(0)

    // Check safe guard trying to access restricted area without a valid session
    await app.goRestricted()
    expect(app.getPresenter(Places.RESTRICTED)).toBeUndefined()
    expect(app.getPresenter(Places.LOGIN)).toBeDefined()
    expect(login).toBe(app.getPresenter(Places.LOGIN)) // Same instance
    expect(login.initialized).toBe(true) // Which is still initialized
    expect(root.scope.body).toBe(login.scope) // And properly bounded to parent scope

    // Check a valid login password
    login.scope.userName = 'test'
    login.scope.password = 'test'
    await login.scope.onEnter()
    expect(login.initialized).toBe(false)
    expect(app.session.id).toEqual(1)

    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted).toBeDefined()
    expect(root.scope.body).toBe(restricted.scope)
    expect(login.initialized).toEqual(false)

    // Check computed value
    expect(2).toEqual(root.scope.computedValue)

    // Check logout
    await restricted.scope.onLogout()
    expect(0).toEqual(app.session.id)
    expect(restricted.initialized).toEqual(false)
    login = app.getPresenter(Places.LOGIN) as LoginPresenter
    expect(login.initialized).toEqual(true)

    // Check computed value
    expect(0).toEqual(root.scope.computedValue)
})

it('Application :: Token Accuracity', async () => {
    const app = new TestApplication()
    const history = app.historyManager as TestHistoryManager

    app.session.id = 1
    app.session.active = true

    await app.goRestricted()
    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted.initialized).toEqual(true)
    expect('restricted?s=1').toEqual(history.token)

    const productPlace = app.newPlace()
    productPlace.setParameter(PARAM_IDs.PRODUCT_ID, 9999)
    await app.goProduct(productPlace)
    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    const cartPlace = app.newPlace()
    cartPlace.setParameter(PARAM_IDs.CART_ID, 1234)
    await app.goCart(cartPlace)
    expect(product.initialized).toEqual(false)
    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart.initialized).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.goRestricted()
    expect(restricted.initialized).toEqual(true)
    expect(cart.initialized).toEqual(false)
    expect(product.initialized).toEqual(false)
});

it('Application :: token Navigation', async () => {
    const app = new TestApplication()
    const history = app.historyManager as TestHistoryManager

    app.session.id = 1
    app.session.active = true

    await app.go('cart?s=1&c=1234')
    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart.initialized).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.go('product?s=1&p=9999')
    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    await app.go('restricted')
    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted.initialized).toEqual(true)
    expect('restricted?s=1').toEqual(history.token)
})