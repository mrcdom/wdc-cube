import { Observable, observe, Scope } from 'wdc-cube'

import type { Id } from '../../domain'

@Observable
export class CycleCardScope extends Scope {
    @observe() name = ''
    @observe() startsAt = ''
    @observe() endsAt = ''
    @observe() total = 0
    @observe() done = 0
    @observe() active = false

    onOpen = Scope.ASYNC_ACTION

    public get progress(): number {
        return this.total === 0 ? 0 : Math.round((this.done / this.total) * 100)
    }
}

@Observable
export class CyclesScope extends Scope {
    @observe() loading = true
    @observe() error?: string
    @observe() cycles: CycleCardScope[] = []
}

export type { Id }
