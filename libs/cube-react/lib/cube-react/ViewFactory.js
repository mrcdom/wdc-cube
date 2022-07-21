import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
export function ViewSlot({ scope, optional = true, view, ...props }) {
    if (scope) {
        if (view) {
            const ctor = view;
            return React.createElement(ctor, { scope, ...props });
        }
        const ctor = ViewFactory.get(scope);
        if (ctor) {
            return React.createElement(ctor, { scope, ...props });
        }
        return (_jsx("div", { className: props.className, style: props.style, children: `View(${scope.constructor.name}) not found!` }));
    }
    else if (!optional) {
        return _jsx("div", { className: props.className, style: props.style });
    }
    else {
        return _jsx(_Fragment, {});
    }
}
const VIEW_PROP_SYM = Symbol('VIEW');
export class ViewFactory {
    static register(scopeCtor, viewCtor) {
        const dynScopeCtor = scopeCtor;
        dynScopeCtor[VIEW_PROP_SYM] = viewCtor;
    }
    static get(scope) {
        if (scope && scope.constructor) {
            const dynScopeCtor = scope.constructor;
            return dynScopeCtor[VIEW_PROP_SYM];
        }
        else {
            return undefined;
        }
    }
    static createView(scope, props) {
        if (props) {
            return _jsx(ViewSlot, { scope: scope, ...props });
        }
        else {
            return _jsx(ViewSlot, { scope: scope });
        }
    }
}
//# sourceMappingURL=ViewFactory.js.map