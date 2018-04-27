/**
 * A lightweight assistant class for loading and saving configuration files
 */
export declare class ConfigLoader<T extends object> {
    private location;
    private defaults;
    /**
     * The raw config, from the file
     */
    private conf;
    /**
     * Whether we are in the middle of the update (to not save in the middle of another save)
     */
    private updating;
    /**
     * Possible callback when the update completes
     */
    private updateComplete;
    /**
     * Whether we should auto-save the file
     */
    autosave: boolean;
    constructor(location: string, defaults: T);
    /**
     * Loads the config file from FS
     */
    load(): Promise<void>;
    /**
     * Shuts down the config loader
     */
    close(): Promise<void>;
    /**
     * The config object
     */
    config: T;
    /**
     * Saves the file to the FS
     */
    save(): Promise<void>;
    /**
     * Returns a raw, unproxied config object
     */
    private readonly rawConfig;
    /**
     * Called when a property on the config object was modified, saves it to FS
     */
    private configWasUpdated();
    /**
     * Creates the file if it doesn't exist and writes defaults
     */
    private ensureExists();
    /**
     * Returns whether the file exists on FS
     */
    private fileExists();
}
