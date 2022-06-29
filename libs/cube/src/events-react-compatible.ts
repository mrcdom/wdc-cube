export type BaseEvent<T = unknown> = {
    readonly type: string
    readonly target: T
    readonly bubbles: boolean
    readonly cancelable: boolean
    readonly defaultPrevented: boolean
    readonly eventPhase: number
    preventDefault(): void
    stopPropagation(): void
}

export type TextChangeEvent = BaseEvent<{ name: string; value: string }>

export type KeyPressEvent<T = unknown> = BaseEvent<T> & {
    readonly key: string
    readonly altKey: boolean
    readonly ctrlKey: boolean
    readonly code: string
    readonly locale: string
    readonly location: number
    readonly metaKey: boolean
    readonly repeat: boolean
    readonly shiftKey: boolean
    getModifierState(key: string): boolean
}

export type CheckedChangeEvent = BaseEvent<{ name: string; checked: boolean }>

export type MouseEvent<T = unknown> = BaseEvent<T> & {
    readonly altKey: boolean
    readonly button: number
    readonly buttons: number
    readonly clientX: number
    readonly clientY: number
    readonly ctrlKey: boolean
    readonly metaKey: boolean
    readonly movementX: number
    readonly movementY: number
    readonly pageX: number
    readonly pageY: number
    readonly relatedTarget: EventTarget | null
    readonly screenX: number
    readonly screenY: number
    readonly shiftKey: boolean

    getModifierState(key: string): boolean
}
