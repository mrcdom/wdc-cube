import { NOOP_VOID, Logger } from 'wdc-cube';
const LOG = Logger.get('React.FC');
function doUpdate(setValue, value) {
    setValue(value + 1);
}
export function bindUpdate(react, scope) {
    const [value, setValue] = react.useState(0);
    scope.forceUpdate = doUpdate.bind(scope, setValue, value);
    react.useEffect(() => {
        return () => {
            scope.forceUpdate = NOOP_VOID;
        };
    }, []);
}
export function getOrCreateApplication(react, factory) {
    const [app, setApp] = react.useState(null);
    const [value, setValue] = react.useState(0);
    let instance;
    if (app) {
        instance = app;
        instance.scope.forceUpdate = doUpdate.bind(instance.scope, setValue, value);
    }
    else {
        instance = factory();
        setApp(instance);
        instance.scope.forceUpdate = doUpdate.bind(instance.scope, setValue, value);
        instance.applyParameters(instance.newFlipIntent(instance.rootPlace), true, true);
    }
    react.useEffect(() => {
        return () => {
            instance.scope.forceUpdate = NOOP_VOID;
            setApp(null);
            LOG.debug('app.detached');
        };
    }, []);
    return instance;
}
//# sourceMappingURL=ReactFunctionalComponent.js.map