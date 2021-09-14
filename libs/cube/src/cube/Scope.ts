import { NOOP_VOID, NOOP_PROMISE_VOID } from './Constants'

export class Scope {

    public static ACTION(): () => Promise<void> {
        return NOOP_PROMISE_VOID
    }

    public static ACTION1<T>(): (p0: T) => Promise<void> {
        return NOOP_PROMISE_VOID
    }

    public static ACTION2<T0, T1>(): (p0: T0, p1: T1) => Promise<void> {
        return NOOP_PROMISE_VOID
    }

    public readonly vid: string

    public update: () => void = NOOP_VOID

    public constructor(vid: string) {
        this.vid = vid
    }

}