export declare class WebFlowHistoryManager {
    static NOOP: WebFlowHistoryManager;
    onChangeListener: (sender: WebFlowHistoryManager) => void;
    private __tokenProvider;
    get tokenProvider(): () => string;
    set tokenProvider(provider: () => string);
    get location(): string;
    update(): void;
}
