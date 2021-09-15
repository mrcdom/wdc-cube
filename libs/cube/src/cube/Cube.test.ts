import { NOOP_VOID, NOOP_PROMISE_VOID } from './Constants'
import { CastUtils } from '../utils/CastUtils'
import { Place } from './Place'
import { PlaceUri } from './PlaceUri'
import { HistoryManager } from './HistoryManager'
import { Application } from './Application'
import { Presenter } from './Presenter'
import { Scope } from './Scope'
import { ScopeSlot } from './ScopeSlot'

it('CastUtils.isArray', () => {
    expect(CastUtils.isArray(undefined)).toEqual(false)
    expect(CastUtils.isArray(null)).toEqual(false)
    expect(CastUtils.isArray(0)).toEqual(false)
    expect(CastUtils.isArray(true)).toEqual(false)
    expect(CastUtils.isArray('abc')).toEqual(false)
    expect(CastUtils.isArray([])).toEqual(true)
})

it('WebFlowPlace.toString  :: Simple Value', () => {
    const uri = new PlaceUri(new Place('root'))
    uri.setParameter('p0', 1)
    uri.setParameter('p1', 1.1)
    uri.setParameter('p2', true)
    uri.setParameter('p3', 'a b c')

    expect(uri.toString()).toEqual('root?p0=1&p1=1.1&p2=true&p3=a+b+c')
})

it('WebFlowURI.parse :: Simple Value', () => {
    const expected = 'root?p0=1&p1=1.1&p2=true&p3=a+b+c'
    const uri = PlaceUri.parse(expected)
    expect(uri.toString()).toEqual(expected)
})

it('WebFlowURI.toString :: Multiple Values', () => {
    const uri = new PlaceUri(new Place('root'))
    uri.setParameter('p0', [1, 2])
    uri.setParameter('p1', [1.1, 2.2])
    uri.setParameter('p2', [true, false])
    uri.setParameter('p3', ['a', 'b', 'c'])

    expect(uri.toString()).toEqual('root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c')
})

it('WebFlowURI.parse :: Multiple Values', () => {
    const expected = 'root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c'
    const uri = PlaceUri.parse(expected)
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

class TestHistoryManager extends HistoryManager {

    public token = ''

    constructor() {
        super()
    }

    public override update(app: Application, place: Place): void {
        this.token = app.newUri(place).toString()
    }

}


const Places = {
    ROOT: Place.UNKNOWN,
    LOGIN: Place.UNKNOWN,
    RESTRICTED: Place.UNKNOWN,
    CART: Place.UNKNOWN,
    PRODUCT: Place.UNKNOWN,
    RECEIPT: Place.UNKNOWN,
}

class TestApplication extends Application {

    public session = {
        id: 0,
        active: false
    }

    constructor() {
        super(Places.ROOT, new TestHistoryManager())
        this.catalogPlaces(Places)
    }

}

// :: Root

class RootScope extends Scope {
    vid = 'root'
    computedValue = 0
    body?: Scope
}

class RootPresenter extends Presenter<TestApplication, RootScope> {

    public initialized = false
    public deepest = false

    private bodySlot: ScopeSlot = this.setBody.bind(this)

    constructor(app: TestApplication) {
        super(app, new RootScope())
    }

    private setBody(scope?: Scope) {
        if (this.scope.body !== scope) {
            this.scope.body = scope
            this.update(this.scope)
        }
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
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

    public override onBeforeScopeUpdate(): void {
        this.scope.computedValue = this.app.session.id * 2
        this.update(this.scope)
    }

    public override publishParameters(uri: PlaceUri): void {
        uri.setParameter(PARAM_IDs.SESSION_ID, this.app.session.id)
    }

}

// :: Login

class LoginScope extends Scope {
    vid = 'login'
    userName?: string
    password?: string
    message?: string

    onEnter: () => Promise<void> = NOOP_PROMISE_VOID
}

class LoginPresenter extends Presenter<TestApplication, LoginScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    deepest = false
    initialized = false

    constructor(app: TestApplication) {
        super(app, new LoginScope())
        this.scope.onEnter = this.onEnter.bind(this)
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
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
                await this.app.flipToUri(uri)
            } else {
                this.scope.message = 'User or password invalid'
            }
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }
}

// :: Restricted

class RestrictedScope extends Scope {
    vid = 'restricted'

    message?: string
    content?: Scope

    onCart: (cartId: number) => Promise<void> = NOOP_PROMISE_VOID
    onProduct: (productId: number) => Promise<void> = NOOP_PROMISE_VOID
    onReceipt: (receiptId: number) => Promise<void> = NOOP_PROMISE_VOID
    onLogout: () => Promise<void> = NOOP_PROMISE_VOID
}

class RestrictedPresenter extends Presenter<TestApplication, RestrictedScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    deepest = false
    initialized = false

    private contentSlot: ScopeSlot = this.setContent.bind(this)

    constructor(app: TestApplication) {
        super(app, new RestrictedScope())
        this.scope.onCart = this.onCart.bind(this)
        this.scope.onProduct = this.onProduct.bind(this)
        this.scope.onReceipt = this.onReceipt.bind(this)
        this.scope.onLogout = this.onLogout.bind(this)
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        // Safe guard agains getting into a restricted area without a valid session
        if (this.app.session.id === 0) {
            const uri = this.app.newUri(Places.LOGIN)
            await this.app.flipToUri(uri)
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

    private setContent(contentScope?: Scope) {
        if (contentScope !== this.scope.content) {
            this.scope.content = contentScope
            this.update(this.scope)
        }
    }

    private async onCart(cartId: number) {
        try {
            const uri = this.app.newUri(Places.CART)
            uri.setParameter(PARAM_IDs.CART_ID, cartId)
            await this.app.flipToUri(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }

    private async onProduct(productId: number) {
        try {
            const uri = this.app.newUri(Places.PRODUCT)
            uri.setParameter(PARAM_IDs.PRODUCT_ID, productId)
            await this.app.flipToUri(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }

    private async onReceipt(receiptId: number) {
        try {
            const uri = this.app.newUri(Places.RECEIPT)
            uri.setParameter(PARAM_IDs.RECEIPT_ID, receiptId)
            await this.app.flipToUri(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }

    private async onLogout() {
        try {
            this.app.session.id = 0
            this.app.session.active = false
            const uri = this.app.newUri(Places.LOGIN)
            await this.app.flipToUri(uri)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }

}

// :: Cart

class CartScope extends Scope {
    vid = 'card'

}

class CartPresenter extends Presenter<TestApplication, CartScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    public initialized = false
    public deepest = false
    public cartId?: number

    public constructor(app: TestApplication) {
        super(app, new CartScope())
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
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

    public override publishParameters(uri: PlaceUri): void {
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

class ProductScope extends Scope {
    vid = 'product'
    name?: string
}

class ProductPresenter extends Presenter<TestApplication, ProductScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    public deepest = false
    public initialized = false
    public productId?: number

    constructor(app: TestApplication) {
        super(app, new ProductScope())
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
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

    public override publishParameters(uri: PlaceUri): void {
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

class ReceiptScope extends Scope {
    vid = 'receipt'
}

class ReceiptPresenter extends Presenter<TestApplication, ReceiptScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    public deepest = false
    public initialized = false

    public constructor(app: TestApplication) {
        super(app, new ReceiptScope())
    }

    public override release() {
        this.initialized = false
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {

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
{
    const place = Place.create

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
}

// Use Case Scenarios

it('Application :: Basic Navigation', async () => {
    const app = new TestApplication()
    await app.flipToUri(app.newUri(Places.LOGIN))

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
    await app.flipToUri(app.newUri(Places.RESTRICTED))
    expect(app.getPresenter(Places.RESTRICTED)).toBeUndefined()
    expect(app.getPresenter(Places.LOGIN)).toBeDefined()
    expect(login).toBe(app.getPresenter(Places.LOGIN)) // Same instance
    expect(login.initialized).toBe(true) // Which is still initialized
    expect(root.scope.body).toBe(login.scope) // And properly bounded to parent scope

    // Check a valid login password
    login.scope.userName = 'test'
    login.scope.password = 'test'
    await login.scope.onEnter()
    expect(login.initialized).toEqual(false)
    expect(app.session.id).toEqual(1)

    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted).toBeDefined()
    expect(root.scope.body).toBe(restricted.scope)

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

    await app.flipToUri(app.newUri(Places.RESTRICTED))
    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted.initialized).toEqual(true)
    expect('restricted?s=1').toEqual(history.token)

    const productUri = app.newUri(Places.PRODUCT)
    productUri.setParameter(PARAM_IDs.PRODUCT_ID, 9999)
    await app.flipToUri(productUri)
    expect(restricted.initialized).toEqual(true)

    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    const cartUri = app.newUri(Places.CART)
    cartUri.setParameter(PARAM_IDs.CART_ID, 1234)
    await app.flipToUri(cartUri)
    expect(restricted.initialized).toEqual(true)
    expect(product.initialized).toEqual(false)
    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart.initialized).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.flipToUri(app.newUri(Places.RESTRICTED))
    expect(restricted.initialized).toEqual(true)
    expect(cart.initialized).toEqual(false)
    expect(product.initialized).toEqual(false)
})

it('Application :: token Navigation', async () => {
    const app = new TestApplication()
    const history = app.historyManager as TestHistoryManager

    app.session.id = 1
    app.session.active = true

    await app.flipToUriString('cart?s=1&c=1234')

    const root = app.getPresenter(Places.ROOT) as RootPresenter
    expect(root).toBeDefined()
    expect(root.initialized).toEqual(true)

    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart).toBeDefined()
    expect(cart.initialized).toEqual(true)
    expect(cart.deepest).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.flipToUriString('product?s=1&p=9999')
    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(product.deepest).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    await app.flipToUriString('restricted')
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