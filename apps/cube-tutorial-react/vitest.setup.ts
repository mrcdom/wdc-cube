// React only allows act() when the environment declares itself a test one;
// without this every render warns.
globalThis.IS_REACT_ACT_ENVIRONMENT = true
