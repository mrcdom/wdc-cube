import { NOOP_VOID } from '../utils/EmptyFunctions'
import { ReflectionUtils } from '../utils/ReflectionUtils'
import { Place } from './Place'
import { FlipIntent } from './FlipIntent'
import { HistoryManager } from './HistoryManager'
import { Application } from './Application'
import { CubePresenter } from './CubePresenter'
import { Scope } from './Scope'
import { ScopeSlot } from './ScopeSlot'

it('CastUtils.isArray', () => {
    expect(ReflectionUtils.isArray(undefined)).toEqual(false)
    expect(ReflectionUtils.isArray(null)).toEqual(false)
    expect(ReflectionUtils.isArray(0)).toEqual(false)
    expect(ReflectionUtils.isArray(true)).toEqual(false)
    expect(ReflectionUtils.isArray('abc')).toEqual(false)
    expect(ReflectionUtils.isArray([])).toEqual(true)
})

it('FlipIntent.toString  :: Simple Value', () => {
    const intent = new FlipIntent(new Place('root'))
    intent.setParameter('p0', 1)
    intent.setParameter('p1', 1.1)
    intent.setParameter('p2', true)
    intent.setParameter('p3', 'a b c')

    expect(intent.toString()).toEqual('root?p0=1&p1=1.1&p2=true&p3=a+b+c')
})

it('FlipIntent.parse :: Simple Value', () => {
    const expected = 'root?p0=1&p1=1.1&p2=true&p3=a+b+c'
    const intent = FlipIntent.parse(expected)
    expect(intent.toString()).toEqual(expected)
})

it('FlipIntent.toString :: Multiple Values', () => {
    const intent = new FlipIntent(new Place('root'))
    intent.setParameter('p0', [1, 2])
    intent.setParameter('p1', [1.1, 2.2])
    intent.setParameter('p2', [true, false])
    intent.setParameter('p3', ['a', 'b', 'c'])

    expect(intent.toString()).toEqual('root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c')
})

it('FlipIntent.parse :: Multiple Values', () => {
    const expected = 'root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c'
    const intent = FlipIntent.parse(expected)
    expect(intent.toString()).toEqual(expected)
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
        this.token = app.newFlipIntent(place).toString()
    }
}

const Places = {
    ROOT: Place.UNKNOWN,
    LOGIN: Place.UNKNOWN,
    RESTRICTED: Place.UNKNOWN,
    CART: Place.UNKNOWN,
    PRODUCT: Place.UNKNOWN,
    RECEIPT: Place.UNKNOWN
}

class TestApplication extends Application {
    public session = {
        id: 0,
        active: false
    }

    constructor() {
        super(Places.ROOT, new TestHistoryManager())
        this.setPlaces(Places)
    }
}

// :: Root

class RootScope extends Scope {
    computedValue = 0
    body?: Scope | null
}

class RootPresenter extends CubePresenter<TestApplication, RootScope> {
    public initialized = false
    public deepest = false

    private bodySlot: ScopeSlot = this.setBody.bind(this)

    constructor(app: TestApplication) {
        super(app, new RootScope())
    }

    private setBody(scope?: Scope | null) {
        if (this.scope.body !== scope) {
            this.scope.body = scope
            this.update(this.scope)
        }
    }

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        deepest: boolean
    ): Promise<boolean> {
        const intentSessionId = intent.getParameterAsNumberOrDefault(PARAM_IDs.SESSION_ID, this.app.session.id)
        if (initialization) {
            this.initialized = true
            this.app.session = await echoService({
                id: intentSessionId,
                active: true
            })
        }

        this.deepest = deepest

        if (deepest) {
            this.setBody(null)
        } else {
            intent.setScopeSlot(ATTR_IDs.PARENT, this.bodySlot)
        }

        return true
    }

    public override onBeforeScopeUpdate(): void {
        this.scope.computedValue = this.app.session.id * 2
        this.update(this.scope)
    }

    public override publishParameters(intent: FlipIntent): void {
        intent.setParameter(PARAM_IDs.SESSION_ID, this.app.session.id)
    }
}

// :: Login

class LoginScope extends Scope {
    userName?: string
    password?: string
    message?: string

    onEnter = Scope.ASYNC_ACTION
}

class LoginPresenter extends CubePresenter<TestApplication, LoginScope> {
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

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        deepest: boolean
    ): Promise<boolean> {
        if (initialization) {
            this.initialized = true
            this.parentSlot = intent.getScopeSlot(ATTR_IDs.PARENT)
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

                const intent = this.app.newFlipIntent(Places.RESTRICTED)
                await this.app.flipToIntent(intent)
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
    message?: string
    content?: Scope | null

    onCart = Scope.ASYNC_ACTION_NUMBER
    onProduct = Scope.ASYNC_ACTION_NUMBER
    onReceipt = Scope.ASYNC_ACTION_NUMBER
    onLogout = Scope.ASYNC_ACTION
}

class RestrictedPresenter extends CubePresenter<TestApplication, RestrictedScope> {
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

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        deepest: boolean
    ): Promise<boolean> {
        // Safe guard agains getting into a restricted area without a valid session
        if (this.app.session.id === 0) {
            const intent = this.app.newFlipIntent(Places.LOGIN)
            await this.app.flipToIntent(intent)
            return false
        }

        if (initialization) {
            this.initialized = true
            this.parentSlot = intent.getScopeSlot(ATTR_IDs.PARENT)
        }

        this.deepest = deepest

        if (deepest) {
            this.setContent(undefined)
        } else {
            intent.setScopeSlot(ATTR_IDs.PARENT, this.contentSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

    private setContent(contentScope?: Scope | null) {
        if (contentScope !== this.scope.content) {
            this.scope.content = contentScope
            this.update(this.scope)
        }
    }

    private async onCart(cartId: number) {
        try {
            const intent = this.app.newFlipIntent(Places.CART)
            intent.setParameter(PARAM_IDs.CART_ID, cartId)
            await this.app.flipToIntent(intent)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }

    private async onProduct(productId: number) {
        try {
            const intent = this.app.newFlipIntent(Places.PRODUCT)
            intent.setParameter(PARAM_IDs.PRODUCT_ID, productId)
            await this.app.flipToIntent(intent)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }

    private async onReceipt(receiptId: number) {
        try {
            const intent = this.app.newFlipIntent(Places.RECEIPT)
            intent.setParameter(PARAM_IDs.RECEIPT_ID, receiptId)
            await this.app.flipToIntent(intent)
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
            const intent = this.app.newFlipIntent(Places.LOGIN)
            await this.app.flipToIntent(intent)
        } catch (caught) {
            this.scope.message = (caught as Error).message
        } finally {
            this.update(this.scope)
        }
    }
}

// :: Cart

class CartScope extends Scope {}

class CartPresenter extends CubePresenter<TestApplication, CartScope> {
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

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        deepest: boolean
    ): Promise<boolean> {
        const urlCartId = intent.getParameterAsNumber(PARAM_IDs.CART_ID)

        if (initialization) {
            this.initialized = true
            this.parentSlot = intent.getScopeSlot(ATTR_IDs.PARENT)
            await this.loadData(urlCartId)
        } else if (urlCartId && this.cartId != urlCartId) {
            await this.loadData(urlCartId)
        }

        this.deepest = deepest
        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        intent.setParameter(PARAM_IDs.CART_ID, this.cartId)
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
    name?: string
}

class ProductPresenter extends CubePresenter<TestApplication, ProductScope> {
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

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        deepest: boolean
    ): Promise<boolean> {
        const intentProductId = intent.getParameterAsNumber(PARAM_IDs.PRODUCT_ID) || this.productId
        if (initialization) {
            this.initialized = true
            this.parentSlot = intent.getScopeSlot(ATTR_IDs.PARENT)
            await this.loadData(intentProductId)
        } else if (intentProductId && intentProductId != this.productId) {
            await this.loadData(intentProductId)
        }

        this.deepest = deepest

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        intent.setParameter(PARAM_IDs.PRODUCT_ID, this.productId)
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

class ReceiptScope extends Scope {}

class ReceiptPresenter extends CubePresenter<TestApplication, ReceiptScope> {
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

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        deepest: boolean
    ): Promise<boolean> {
        if (initialization) {
            this.initialized = true
            this.parentSlot = intent.getScopeSlot(ATTR_IDs.PARENT)
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
    await app.flipToIntent(app.newFlipIntent(Places.LOGIN))

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
    await app.flipToIntent(app.newFlipIntent(Places.RESTRICTED))
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
    root.updateManager.emitBeforeScopeUpdate()
    expect(2).toEqual(root.scope.computedValue)

    // Check logout
    await restricted.scope.onLogout()
    expect(0).toEqual(app.session.id)
    expect(restricted.initialized).toEqual(false)
    login = app.getPresenter(Places.LOGIN) as LoginPresenter
    expect(login.initialized).toEqual(true)

    // Check computed value
    root.updateManager.emitBeforeScopeUpdate()
    expect(0).toEqual(root.scope.computedValue)
})

it('Application :: Token Accuracity', async () => {
    const app = new TestApplication()
    const history = app.historyManager as TestHistoryManager

    app.session.id = 1
    app.session.active = true

    await app.flipToIntent(app.newFlipIntent(Places.RESTRICTED))
    const restricted = app.getPresenter(Places.RESTRICTED) as RestrictedPresenter
    expect(restricted.initialized).toEqual(true)
    expect('restricted?s=1').toEqual(history.token)

    const productIntent = app.newFlipIntent(Places.PRODUCT)
    productIntent.setParameter(PARAM_IDs.PRODUCT_ID, 9999)
    await app.flipToIntent(productIntent)
    expect(restricted.initialized).toEqual(true)

    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    const cartIntent = app.newFlipIntent(Places.CART)
    cartIntent.setParameter(PARAM_IDs.CART_ID, 1234)
    await app.flipToIntent(cartIntent)
    expect(restricted.initialized).toEqual(true)
    expect(product.initialized).toEqual(false)
    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart.initialized).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.flipToIntent(app.newFlipIntent(Places.RESTRICTED))
    expect(restricted.initialized).toEqual(true)
    expect(cart.initialized).toEqual(false)
    expect(product.initialized).toEqual(false)
})

it('Application :: token Navigation', async () => {
    const app = new TestApplication()
    const history = app.historyManager as TestHistoryManager

    app.session.id = 1
    app.session.active = true

    await app.flipToIntentString('cart?s=1&c=1234')

    const root = app.getPresenter(Places.ROOT) as RootPresenter
    expect(root).toBeDefined()
    expect(root.initialized).toEqual(true)

    const cart = app.getPresenter(Places.CART) as CartPresenter
    expect(cart).toBeDefined()
    expect(cart.initialized).toEqual(true)
    expect(cart.deepest).toEqual(true)
    expect(1234).toEqual(cart.cartId)
    expect('cart?s=1&c=1234').toEqual(history.token)

    await app.flipToIntentString('product?s=1&p=9999')
    const product = app.getPresenter(Places.PRODUCT) as ProductPresenter
    expect(product).toBeDefined()
    expect(product.initialized).toEqual(true)
    expect(product.deepest).toEqual(true)
    expect(9999).toEqual(product.productId)
    expect('product-' + 9999).toEqual(product.scope.name)
    expect('product?s=1&p=9999').toEqual(history.token)

    await app.flipToIntentString('restricted')
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
