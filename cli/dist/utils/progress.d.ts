export declare class ProgressReporter {
    private spinner;
    private quiet;
    constructor(quiet?: boolean);
    start(message: string): void;
    update(message: string): void;
    succeed(message: string): void;
    fail(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    progressBar(current: number, total: number, label?: string): void;
}
