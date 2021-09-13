export type ServiceLike = {
    get initialized(): boolean
    postConstruct(): Promise<void>
    preDestroy(): Promise<void>
}