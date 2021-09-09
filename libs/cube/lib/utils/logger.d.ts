interface ILogger {
    info(...data: any[]): void;
    warn(...data: any[]): void;
    error(...data: any[]): void;
    debug(...data: any[]): void;
}
export declare class Logger {
    static get(name: string): ILogger;
}
export {};
