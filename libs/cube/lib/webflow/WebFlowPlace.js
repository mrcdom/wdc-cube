import { newPresenterFactory } from './WebFlowPresenter';
const indexGenMap = new Map();
const noPresenterFactory = () => {
    throw new Error('No presenter factory was provided');
};
export class WebFlowPlace {
    constructor(name, parent, factory = noPresenterFactory, id) {
        this.name = name;
        this.parent = parent;
        this.factory = factory;
        this.path = [];
        const pathNameBuilder = [];
        this.buildPath(pathNameBuilder, this);
        this.id = typeof id === 'number' ? id : this.nextId();
        this.pathName = pathNameBuilder.join('/');
    }
    static createUnbunded(name) {
        return new WebFlowPlace(name, undefined, () => {
            throw new Error('Unbounded place can not create a presenter');
        }, -1);
    }
    static create(name, ctor, parent) {
        return new WebFlowPlace(name, parent, newPresenterFactory(ctor));
    }
    toString() {
        return this.pathName;
    }
    buildPath(pathNameBuilder, step) {
        if (step.parent) {
            this.buildPath(pathNameBuilder, step.parent);
        }
        if (step && step.id != -1) {
            pathNameBuilder.push(step.name);
            this.path.push(step);
        }
    }
    nextId() {
        let idxLevelGen = indexGenMap.get(this.path.length);
        if (idxLevelGen === undefined) {
            idxLevelGen = this.path.length * 1000;
        }
        else {
            idxLevelGen++;
        }
        indexGenMap.set(this.path.length, idxLevelGen);
        return idxLevelGen;
    }
}
WebFlowPlace.UNKNOWN = WebFlowPlace.createUnbunded('unknown');
//# sourceMappingURL=WebFlowPlace.js.map