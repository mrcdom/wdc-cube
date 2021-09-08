import { NOOP_VOID, NOOP_PROMISE_VOID } from './Constants'
import { CastUtils } from './CastUtils'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowURI } from './WebFlowURI'
import { WebFlowHistoryManager } from './WebFlowHistoryManager'
import { WebFlowApplication } from './WebFlowApplication'
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
    const uri = new WebFlowURI(new WebFlowPlace('root'))
    uri.setParameter('p0', 1)
    uri.setParameter('p1', 1.1)
    uri.setParameter('p2', true)
    uri.setParameter('p3', 'a b c')

    expect(uri.toString()).toEqual('root?p0=1&p1=1.1&p2=true&p3=a+b+c')
})

it('WebFlowURI.parse :: Simple Value', () => {
    const expected = 'root?p0=1&p1=1.1&p2=true&p3=a+b+c'
    const uri = WebFlowURI.parse(expected)
    expect(uri.toString()).toEqual(expected)
})

it('WebFlowURI.toString :: Multiple Values', () => {
    const uri = new WebFlowURI(new WebFlowPlace('root'))
    uri.setParameter('p0', [1, 2])
    uri.setParameter('p1', [1.1, 2.2])
    uri.setParameter('p2', [true, false])
    uri.setParameter('p3', ['a', 'b', 'c'])

    expect(uri.toString()).toEqual('root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c')
})

it('WebFlowURI.parse :: Multiple Values', () => {
    const expected = 'root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c'
    const uri = WebFlowURI.parse(expected)
    expect(uri.toString()).toEqual(expected)
})

async function echoService<T>(v: T): Promise<T> {
    return v
}

const PARAM_IDs = {
    SESSION_ID: 's',
    CART_ID: 'c',
    PRODUCT_ID: 'p',
    RECEIPT_ID: 'r'
}

const ATTR_IDs = {
    PARENT: 'parent'
}

class TestHistoryManager extends WebFlowHistoryManager {

    public token = ''

    constructor() {
        super()
    }

    public override update(tokenProvider: () => string): void {
        this.token = tokenProvider()
    }

}


const Places = {
    ROOT: WebFlowPlace.UNKNOWN,
    LOGIN: WebFlowPlace.UNKNOWN,
    RESTRICTED: WebFlowPlace.UNKNOWN,
    CART: WebFlowPlace.UNKNOWN,
    PRODUCT: WebFlowPlace.UNKNOWN,
    RECEIPT: WebFlowPlace.UNKNOWN,
}

class TestApplication extends WebFlowApplication {

    public session = {
        id: 0,
        active: false
    }

    constructor() {
        super(new TestHistoryManager())
        this.catalogPlaces(Places)
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

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
        const uriSessionId = uri.getParameterAsNumberOrDefault(PARAM_IDs.SESSION_ID, this.app.session.id)
        if (initialization) {
            this.initialized = true
            this.app.session = await echoService({
                id: uriSessionId,
                active: true
            })
        }

        this.deepest = deepest

        if (deepest) {
            this.setBody(undefined)
        } else {
            uri.setScopeSlot(ATTR_IDs.PARENT, this.bodySlot)
        }

        return true
    }

    public override computeDerivatedFields(): void {
        this.scope.computedValue = this.app.session.id * 2
    }

    public override publishParameters(uri: WebFlowURI): void {
        uri.setParameter(PARAM_IDs.SESSION_ID, this.app.session.id)
    }

}

// :: Login

class LoginScope extends WebFlowScope {
    userName?: string
    password?: string
    message?: string

    onEnter: () => Promise<void> = NOOP_PROMISE_VOID
}

class LoginPresenter extends WebFlowPresenter<TestApplication, LoginScope> {

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    deepest = false
    initialized = false

    constructor(app: TestApplication) {
        super(app, new LoginScope('v-login'))
        this.scope.onEnter = this.onEnter.bind(this)
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.initialized = true
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
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

                const uri = this.app.newUri(Places.RESTRICTED)
                await this.app.navigate(uri)
            } else {
                this.scope.message = 'User or password invalid'
            }
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.scope.update()
        }
    }
}

// :: Restricted

class RestrictedScope extends WebFlowScope {
    message?: string

    content?: WebFlowScope

    onCart: (cartId: number) => Promise<void> = NOOP_PROMISE_VOID
    onProduct: (productId: number) => Promise<void> = NOOP_PROMISE_VOID
    onReceipt: (receiptId: number) => Promise<void> = NOOP_PROMISE_VOID
    onLogout: () => Promise<void> = NOOP_PROMISE_VOID
}

class RestrictedPresenter extends WebFlowPresenter<TestApplication, RestrictedScope> {

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    deepest = false
    initialized = false

    private contentSlot: WebFlowScopeSlot = this.setContent.bind(this)

    constructor(app: TestApplication) {
        super(app, new RestrictedScope('v-restricted'))
        this.scope.onCart = this.onCart.bind(this)
        this.scope.onProduct = this.onProduct.bind(this)
        this.scope.onReceipt = this.onReceipt.bind(this)
        this.scope.onLogout = this.onLogout.bind(this)
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
        // Safe guard agains getting into a restricted area without a valid session
        if (this.app.session.id === 0) {
            const uri = this.app.newUri(Places.LOGIN)
            await this.app.navigate(uri)
            return false
        }

        if (initialization) {
            this.initialized = true
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        if (deepest) {
            this.setContent(undefined)
        } else {
            uri.setScopeSlot(ATTR_IDs.PARENT, this.contentSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

    private setContent(contentScope?: WebFlowScope) {
        if (contentScope !== this.scope.content) {
            this.scope.content = contentScope
            this.scope.update()
        }
    }

    private async onCart(cartId: number) {
        try {
            const uri = this.app.newUri(Places.CART)
            uri.setParameter(PARAM_IDs.CART_ID, cartId)
            await this.app.navigate(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.scope.update()
        }
    }

    private async onProduct(productId: number) {
        try {
            const uri = this.app.newUri(Places.PRODUCT)
            uri.setParameter(PARAM_IDs.PRODUCT_ID, productId)
            await this.app.navigate(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.scope.update()
        }
    }

    private async onReceipt(receiptId: number) {
        try {
            const uri = this.app.newUri(Places.RECEIPT)
            uri.setParameter(PARAM_IDs.RECEIPT_ID, receiptId)
            await this.app.navigate(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.scope.update()
        }
    }

    private async onLogout() {
        try {
            this.app.session.id = 0
            this.app.session.active = false
            const uri = this.app.newUri(Places.LOGIN)
            await this.app.navigate(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.scope.update()
        }
    }

}

// :: Cart

class CartScope extends WebFlowScope {

}

class CartPresenter extends WebFlowPresenter<TestApplication, CartScope> {

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    public initialized = false
    public deepest = false
    public cartId?: number

    public constructor(app: TestApplication) {
        super(app, new CartScope('v-cart'))
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
        const urlCartId = uri.getParameterAsNumber(PARAM_IDs.CART_ID)

        if (initialization) {
            this.initialized = true
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT)
            await this.loadData(urlCartId)
        } else if (urlCartId && this.cartId != urlCartId) {
            await this.loadData(urlCartId)
        }

        this.deepest = deepest
        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(uri: WebFlowURI): void {
        uri.setParameter(PARAM_IDs.CART_ID, this.cartId)
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

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    public deepest = false
    public initialized = false
    public productId?: number

    constructor(app: TestApplication) {
        super(app, new ProductScope('v-product'))
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
        const uriProductId = uri.getParameterAsNumber(PARAM_IDs.PRODUCT_ID) || this.productId
        if (initialization) {
            this.initialized = true
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT)
            await this.loadData(uriProductId)
        } else if (uriProductId && uriProductId != this.productId) {
            await this.loadData(uriProductId)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(uri: WebFlowURI): void {
        uri.setParameter(PARAM_IDs.PRODUCT_ID, this.productId)
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

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    public deepest = false
    public initialized = false

    public constructor(app: TestApplication) {
        super(app, new ReceiptScope('v-receipt'))
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {

        if (initialization) {
            this.initialized = true
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

}

// Prepare places
(function () {
    const place = WebFlowPlace.create

    Places.ROOT = place('root', RootPresenter)
    {
        Places.LOGIN = place('login', LoginPresenter, Places.ROOT)
        Places.RESTRICTED = place('restricted', RestrictedPresenter, Places.ROOT)
        {
            Places.CART = place('cart', CartPresenter, Places.RESTRICTED)
            Places.PRODUCT = place('product', ProductPresenter, Places.RESTRICTED)
            Places.RECEIPT = place('receipt', ReceiptPresenter, Places.RESTRICTED)
        }
    }
})()

// Use Case Scenarios

it('Application :: Basic Navigation', async () => {
    const app = new TestApplication()
    await app.navigate(app.newUri(Places.LOGIN))

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
    await app.navigate(app.newUri(Places.RESTRICTED))
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

    await app.navigate(app.newUri(Places.RESTRICTED))
    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted.initialized).toEqual(true)
    expect('restricted?s=1').toEqual(history.token)

    const productUri = app.newUri(Places.PRODUCT)
    productUri.setParameter(PARAM_IDs.PRODUCT_ID, 9999)
    await app.navigate(productUri)
    expect(restricted.initialized).toEqual(true)

    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    const cartUri = app.newUri(Places.CART)
    cartUri.setParameter(PARAM_IDs.CART_ID, 1234)
    await app.navigate(cartUri)
    expect(restricted.initialized).toEqual(true)
    expect(product.initialized).toEqual(false)
    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart.initialized).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.navigate(app.newUri(Places.RESTRICTED))
    expect(restricted.initialized).toEqual(true)
    expect(cart.initialized).toEqual(false)
    expect(product.initialized).toEqual(false)
})

it('Application :: token Navigation', async () => {
    const app = new TestApplication()
    const history = app.historyManager as TestHistoryManager

    app.session.id = 1
    app.session.active = true

    await app.navigate('cart?s=1&c=1234')

    const root = app.getPresenter(Places.ROOT) as RootPresenter
    expect(root).toBeDefined()
    expect(root.initialized).toEqual(true)

    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart).toBeDefined()
    expect(cart.initialized).toEqual(true)
    expect(cart.deepest).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.navigate('product?s=1&p=9999')
    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(product.deepest).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    await app.navigate('restricted')
    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted).toBeDefined()
    expect(restricted.initialized).toEqual(true)
    expect(restricted.deepest).toEqual(true)
    expect('restricted?s=1').toEqual(history.token)

    // Check if presenter state was reached

    expect(root.initialized).toEqual(true)
    expect(cart.initialized).toEqual(false)
    expect(product.initialized).toEqual(false)
})