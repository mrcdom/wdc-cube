export const NOOP_VOID = () => {
    // NOOP
}

export const NOOP_STRING = () => {
    return ''
}

export const NOOP_PROMISE_VOID = () => {
    return Promise.resolve<void>(void 0)
}