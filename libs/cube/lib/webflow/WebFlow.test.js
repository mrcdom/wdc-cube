import { NOOP_VOID, NOOP_PROMISE_VOID } from './Constants';
import { CastUtils } from './CastUtils';
import { WebFlowPlace } from './WebFlowPlace';
import { WebFlowURI } from './WebFlowURI';
import { WebFlowHistoryManager } from './WebFlowHistoryManager';
import { WebFlowApplication } from './WebFlowApplication';
import { WebFlowPresenter } from './WebFlowPresenter';
import { WebFlowScope } from './WebFlowScope';
it('CastUtils.isArray', () => {
    expect(CastUtils.isArray(undefined)).toEqual(false);
    expect(CastUtils.isArray(null)).toEqual(false);
    expect(CastUtils.isArray(0)).toEqual(false);
    expect(CastUtils.isArray(true)).toEqual(false);
    expect(CastUtils.isArray('abc')).toEqual(false);
    expect(CastUtils.isArray([])).toEqual(true);
});
it('WebFlowPlace.toString  :: Simple Value', () => {
    const uri = new WebFlowURI(new WebFlowPlace('root'));
    uri.setParameter('p0', 1);
    uri.setParameter('p1', 1.1);
    uri.setParameter('p2', true);
    uri.setParameter('p3', 'a b c');
    expect(uri.toString()).toEqual('root?p0=1&p1=1.1&p2=true&p3=a+b+c');
});
it('WebFlowURI.parse :: Simple Value', () => {
    const expected = 'root?p0=1&p1=1.1&p2=true&p3=a+b+c';
    const uri = WebFlowURI.parse(expected);
    expect(uri.toString()).toEqual(expected);
});
it('WebFlowURI.toString :: Multiple Values', () => {
    const uri = new WebFlowURI(new WebFlowPlace('root'));
    uri.setParameter('p0', [1, 2]);
    uri.setParameter('p1', [1.1, 2.2]);
    uri.setParameter('p2', [true, false]);
    uri.setParameter('p3', ['a', 'b', 'c']);
    expect(uri.toString()).toEqual('root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c');
});
it('WebFlowURI.parse :: Multiple Values', () => {
    const expected = 'root?p0=1&p0=2&p1=1.1&p1=2.2&p2=true&p2=false&p3=a&p3=b&p3=c';
    const uri = WebFlowURI.parse(expected);
    expect(uri.toString()).toEqual(expected);
});
async function echoService(v) {
    return v;
}
const PARAM_IDs = {
    SESSION_ID: 's',
    CART_ID: 'c',
    PRODUCT_ID: 'p',
    RECEIPT_ID: 'r'
};
const ATTR_IDs = {
    PARENT: 'parent'
};
class TestHistoryManager extends WebFlowHistoryManager {
    constructor() {
        super();
        this.token = '';
    }
    update() {
        this.token = this.tokenProvider();
    }
}
const Places = {
    ROOT: WebFlowPlace.UNKNOWN,
    LOGIN: WebFlowPlace.UNKNOWN,
    RESTRICTED: WebFlowPlace.UNKNOWN,
    CART: WebFlowPlace.UNKNOWN,
    PRODUCT: WebFlowPlace.UNKNOWN,
    RECEIPT: WebFlowPlace.UNKNOWN,
};
class TestApplication extends WebFlowApplication {
    constructor() {
        super(new TestHistoryManager());
        this.session = {
            id: 0,
            active: false
        };
        this.catalogPlaces(Places);
    }
}
class RootScope extends WebFlowScope {
    constructor() {
        super(...arguments);
        this.computedValue = 0;
    }
}
class RootPresenter extends WebFlowPresenter {
    constructor(app) {
        super(app, new RootScope('v-root'));
        this.initialized = false;
        this.deepest = false;
        this.bodySlot = this.setBody.bind(this);
    }
    setBody(scope) {
        if (this.scope.body !== scope) {
            this.scope.body = scope;
            this.scope.update();
        }
    }
    async applyParameters(uri, initialization, deepest) {
        const uriSessionId = uri.getParameterAsNumberOrDefault(PARAM_IDs.SESSION_ID, this.app.session.id);
        if (initialization) {
            this.initialized = true;
            this.app.session = await echoService({
                id: uriSessionId,
                active: true
            });
        }
        this.deepest = deepest;
        if (deepest) {
            this.setBody(undefined);
        }
        else {
            uri.setScopeSlot(ATTR_IDs.PARENT, this.bodySlot);
        }
        return true;
    }
    computeDerivatedFields() {
        this.scope.computedValue = this.app.session.id * 2;
    }
    publishParameters(uri) {
        uri.setParameter(PARAM_IDs.SESSION_ID, this.app.session.id);
    }
}
class LoginScope extends WebFlowScope {
    constructor() {
        super(...arguments);
        this.onEnter = NOOP_PROMISE_VOID;
    }
}
class LoginPresenter extends WebFlowPresenter {
    constructor(app) {
        super(app, new LoginScope('v-login'));
        this.parentSlot = NOOP_VOID;
        this.deepest = false;
        this.initialized = false;
        this.scope.onEnter = this.onEnter.bind(this);
    }
    release() {
        this.initialized = false;
        super.release();
    }
    async applyParameters(uri, initialization, deepest) {
        if (initialization) {
            this.initialized = true;
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT);
        }
        this.deepest = deepest;
        this.parentSlot(this.scope);
        return true;
    }
    async onEnter() {
        try {
            this.scope.message = undefined;
            if (this.scope.userName === 'test' && this.scope.password === 'test') {
                this.app.session = await echoService({
                    id: 1,
                    active: true
                });
                const uri = this.app.newUri(Places.RESTRICTED);
                await this.app.navigate(uri);
            }
            else {
                this.scope.message = 'User or password invalid';
            }
        }
        catch (caught) {
            this.scope.message = caught.message;
        }
        finally {
            this.scope.update();
        }
    }
}
class RestrictedScope extends WebFlowScope {
    constructor() {
        super(...arguments);
        this.onCart = NOOP_PROMISE_VOID;
        this.onProduct = NOOP_PROMISE_VOID;
        this.onReceipt = NOOP_PROMISE_VOID;
        this.onLogout = NOOP_PROMISE_VOID;
    }
}
class RestrictedPresenter extends WebFlowPresenter {
    constructor(app) {
        super(app, new RestrictedScope('v-restricted'));
        this.parentSlot = NOOP_VOID;
        this.deepest = false;
        this.initialized = false;
        this.contentSlot = this.setContent.bind(this);
        this.scope.onCart = this.onCart.bind(this);
        this.scope.onProduct = this.onProduct.bind(this);
        this.scope.onReceipt = this.onReceipt.bind(this);
        this.scope.onLogout = this.onLogout.bind(this);
    }
    release() {
        this.initialized = false;
        super.release();
    }
    async applyParameters(uri, initialization, deepest) {
        if (this.app.session.id === 0) {
            const uri = this.app.newUri(Places.LOGIN);
            await this.app.navigate(uri);
            return false;
        }
        if (initialization) {
            this.initialized = true;
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT);
        }
        this.deepest = deepest;
        if (deepest) {
            this.setContent(undefined);
        }
        else {
            uri.setScopeSlot(ATTR_IDs.PARENT, this.contentSlot);
        }
        this.parentSlot(this.scope);
        return true;
    }
    setContent(contentScope) {
        if (contentScope !== this.scope.content) {
            this.scope.content = contentScope;
            this.scope.update();
        }
    }
    async onCart(cartId) {
        try {
            const uri = this.app.newUri(Places.CART);
            uri.setParameter(PARAM_IDs.CART_ID, cartId);
            await this.app.navigate(uri);
        }
        catch (caught) {
            this.scope.message = caught.message;
        }
        finally {
            this.scope.update();
        }
    }
    async onProduct(productId) {
        try {
            const uri = this.app.newUri(Places.PRODUCT);
            uri.setParameter(PARAM_IDs.PRODUCT_ID, productId);
            await this.app.navigate(uri);
        }
        catch (caught) {
            this.scope.message = caught.message;
        }
        finally {
            this.scope.update();
        }
    }
    async onReceipt(receiptId) {
        try {
            const uri = this.app.newUri(Places.RECEIPT);
            uri.setParameter(PARAM_IDs.RECEIPT_ID, receiptId);
            await this.app.navigate(uri);
        }
        catch (caught) {
            this.scope.message = caught.message;
        }
        finally {
            this.scope.update();
        }
    }
    async onLogout() {
        try {
            this.app.session.id = 0;
            this.app.session.active = false;
            const uri = this.app.newUri(Places.LOGIN);
            await this.app.navigate(uri);
        }
        catch (caught) {
            this.scope.message = caught.message;
        }
        finally {
            this.scope.update();
        }
    }
}
class CartScope extends WebFlowScope {
}
class CartPresenter extends WebFlowPresenter {
    constructor(app) {
        super(app, new CartScope('v-cart'));
        this.parentSlot = NOOP_VOID;
        this.initialized = false;
        this.deepest = false;
    }
    release() {
        this.initialized = false;
        super.release();
    }
    async applyParameters(uri, initialization, deepest) {
        const urlCartId = uri.getParameterAsNumber(PARAM_IDs.CART_ID);
        if (initialization) {
            this.initialized = true;
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT);
            await this.loadData(urlCartId);
        }
        else if (urlCartId && this.cartId != urlCartId) {
            await this.loadData(urlCartId);
        }
        this.deepest = deepest;
        this.parentSlot(this.scope);
        return true;
    }
    publishParameters(uri) {
        uri.setParameter(PARAM_IDs.CART_ID, this.cartId);
    }
    async loadData(cartId) {
        if (!cartId) {
            throw new Error('Missing cartId');
        }
        const data = await echoService({
            cartId: cartId
        });
        this.cartId = data.cartId;
    }
}
class ProductScope extends WebFlowScope {
}
class ProductPresenter extends WebFlowPresenter {
    constructor(app) {
        super(app, new ProductScope('v-product'));
        this.parentSlot = NOOP_VOID;
        this.deepest = false;
        this.initialized = false;
    }
    release() {
        this.initialized = false;
        super.release();
    }
    async applyParameters(uri, initialization, deepest) {
        const uriProductId = uri.getParameterAsNumber(PARAM_IDs.PRODUCT_ID) || this.productId;
        if (initialization) {
            this.initialized = true;
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT);
            await this.loadData(uriProductId);
        }
        else if (uriProductId && uriProductId != this.productId) {
            await this.loadData(uriProductId);
        }
        this.deepest = deepest;
        this.parentSlot(this.scope);
        return true;
    }
    publishParameters(uri) {
        uri.setParameter(PARAM_IDs.PRODUCT_ID, this.productId);
    }
    async loadData(productId) {
        if (!productId) {
            throw new Error('Missing productId');
        }
        const data = await echoService({
            id: productId,
            name: 'product-' + productId
        });
        this.productId = data.id;
        this.scope.name = data.name;
    }
}
class ReceiptScope extends WebFlowScope {
}
class ReceiptPresenter extends WebFlowPresenter {
    constructor(app) {
        super(app, new ReceiptScope('v-receipt'));
        this.parentSlot = NOOP_VOID;
        this.deepest = false;
        this.initialized = false;
    }
    release() {
        this.initialized = false;
        super.release();
    }
    async applyParameters(uri, initialization, deepest) {
        if (initialization) {
            this.initialized = true;
            this.parentSlot = uri.getScopeSlot(ATTR_IDs.PARENT);
        }
        this.deepest = deepest;
        this.parentSlot(this.scope);
        return true;
    }
}
(function () {
    const place = WebFlowPlace.create;
    Places.ROOT = place('root', RootPresenter);
    {
        Places.LOGIN = place('login', LoginPresenter, Places.ROOT);
        Places.RESTRICTED = place('restricted', RestrictedPresenter, Places.ROOT);
        {
            Places.CART = place('cart', CartPresenter, Places.RESTRICTED);
            Places.PRODUCT = place('product', ProductPresenter, Places.RESTRICTED);
            Places.RECEIPT = place('receipt', ReceiptPresenter, Places.RESTRICTED);
        }
    }
})();
it('Application :: Basic Navigation', async () => {
    const app = new TestApplication();
    await app.navigate(app.newUri(Places.LOGIN));
    const root = app.getPresenter(Places.ROOT);
    expect(root).toBeDefined();
    expect(root.initialized).toEqual(true);
    expect(root.deepest).toEqual(false);
    expect(app.session.id).toEqual(0);
    let login = app.getPresenter(Places.LOGIN);
    expect(login).toBeDefined();
    expect(login.initialized).toEqual(true);
    expect(login.deepest).toEqual(true);
    expect(login.scope.userName).toBeUndefined();
    expect(login.scope.password).toBeUndefined();
    expect(root.scope.body).toBe(login.scope);
    login.scope.userName = 'test';
    login.scope.password = 'wrong-password';
    await login.scope.onEnter();
    expect(login.scope.message).toBe('User or password invalid');
    expect(root.scope.body).toBe(login.scope);
    expect(app.session.id).toEqual(0);
    await app.navigate(app.newUri(Places.RESTRICTED));
    expect(app.getPresenter(Places.RESTRICTED)).toBeUndefined();
    expect(app.getPresenter(Places.LOGIN)).toBeDefined();
    expect(login).toBe(app.getPresenter(Places.LOGIN));
    expect(login.initialized).toBe(true);
    expect(root.scope.body).toBe(login.scope);
    login.scope.userName = 'test';
    login.scope.password = 'test';
    await login.scope.onEnter();
    expect(login.initialized).toBe(false);
    expect(app.session.id).toEqual(1);
    const restricted = app.getPresenter(Places.RESTRICTED);
    expect(restricted).toBeDefined();
    expect(root.scope.body).toBe(restricted.scope);
    expect(login.initialized).toEqual(false);
    expect(2).toEqual(root.scope.computedValue);
    await restricted.scope.onLogout();
    expect(0).toEqual(app.session.id);
    expect(restricted.initialized).toEqual(false);
    login = app.getPresenter(Places.LOGIN);
    expect(login.initialized).toEqual(true);
    expect(0).toEqual(root.scope.computedValue);
});
it('Application :: Token Accuracity', async () => {
    const app = new TestApplication();
    const history = app.historyManager;
    app.session.id = 1;
    app.session.active = true;
    await app.navigate(app.newUri(Places.RESTRICTED));
    const restricted = app.getPresenter(Places.RESTRICTED);
    expect(restricted.initialized).toEqual(true);
    expect('restricted?s=1').toEqual(history.token);
    const productUri = app.newUri(Places.PRODUCT);
    productUri.setParameter(PARAM_IDs.PRODUCT_ID, 9999);
    await app.navigate(productUri);
    expect(restricted.initialized).toEqual(true);
    const product = app.getPresenter(Places.PRODUCT);
    expect(product).toBeDefined();
    expect(product.initialized).toEqual(true);
    expect(9999).toEqual(product.productId);
    expect('product-' + 9999).toEqual(product.scope.name);
    expect('product?s=1&p=9999').toEqual(history.token);
    const cartUri = app.newUri(Places.CART);
    cartUri.setParameter(PARAM_IDs.CART_ID, 1234);
    await app.navigate(cartUri);
    expect(restricted.initialized).toEqual(true);
    expect(product.initialized).toEqual(false);
    const cart = app.getPresenter(Places.CART);
    expect(cart.initialized).toEqual(true);
    expect(1234).toEqual(cart.cartId);
    expect('cart?s=1&c=1234').toEqual(history.token);
    await app.navigate(app.newUri(Places.RESTRICTED));
    expect(restricted.initialized).toEqual(true);
    expect(cart.initialized).toEqual(false);
    expect(product.initialized).toEqual(false);
});
it('Application :: token Navigation', async () => {
    const app = new TestApplication();
    const history = app.historyManager;
    app.session.id = 1;
    app.session.active = true;
    await app.navigate('cart?s=1&c=1234');
    const root = app.getPresenter(Places.ROOT);
    expect(root).toBeDefined();
    expect(root.initialized).toEqual(true);
    const cart = app.getPresenter(Places.CART);
    expect(cart).toBeDefined();
    expect(cart.initialized).toEqual(true);
    expect(cart.deepest).toEqual(true);
    expect(1234).toEqual(cart.cartId);
    expect('cart?s=1&c=1234').toEqual(history.token);
    await app.navigate('product?s=1&p=9999');
    const product = app.getPresenter(Places.PRODUCT);
    expect(product).toBeDefined();
    expect(product.initialized).toEqual(true);
    expect(product.deepest).toEqual(true);
    expect(9999).toEqual(product.productId);
    expect('product-' + 9999).toEqual(product.scope.name);
    expect('product?s=1&p=9999').toEqual(history.token);
    await app.navigate('restricted');
    const restricted = app.getPresenter(Places.RESTRICTED);
    expect(restricted).toBeDefined();
    expect(restricted.initialized).toEqual(true);
    expect(restricted.deepest).toEqual(true);
    expect('restricted?s=1').toEqual(history.token);
    expect(root.initialized).toEqual(true);
    expect(cart.initialized).toEqual(false);
    expect(product.initialized).toEqual(false);
});
//# sourceMappingURL=WebFlow.test.js.map