export declare class ConfigLoader<T extends object> {
    private location;
    private defaults;
    private conf;
    private updating;
    private updateComplete;
    autoUpdate: boolean;
    constructor(location: string, defaults: T);
    load(): Promise<void>;
    close(): Promise<void>;
    readonly config: T;
    save(): Promise<void>;
    private readonly rawConfig;
    private configWasUpdated();
    private ensureExists();
    private fileExists();
}
