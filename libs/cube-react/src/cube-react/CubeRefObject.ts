import React from 'react'

export class CubeRefObject<T> implements React.RefObject<T> {
    public current: T | null

    constructor(elm?: T | null) {
        this.current = elm ?? null
    }
}
