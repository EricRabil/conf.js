import fs = require("fs-extra");
import util from "util";

/**
 * Creates an object which calls an update method whenever any key anywhere on the object is updated.
 * @param object the object to proxy
 * @param update the update method
 */
function proxy<T extends object>(object: T, update: () => void): T {
    const proxyObj: T = new Proxy(object, {
        get(target, proxyKey) {
            return typeof target[proxyKey] === "object" ? proxy(target[proxyKey], update) : target[proxyKey];
        },
        set(target, proxyKey, value, receiver) {
            target[proxyKey] = value;
            update();
            return true;
        }
    });
    return proxyObj;
}

/**
 * Converts an entire object to a read-only object
 * @param object the object to finalize
 */
function readOnly<T extends object>(object: T): T {
    return new Proxy(object, {
        get(target, proxyKey) {
            return typeof target[proxyKey] === "object" ? readOnly(object) : target[proxyKey];
        },
        set() {
            return true;
        }
    });
}

/**
 * A lightweight assistant class for loading and saving configuration files
 */
export class ConfigLoader<T extends object> {

    /**
     * The raw config, from the file
     */
    private conf: T | null = null;
    /**
     * Whether we are in the middle of the update (to not save in the middle of another save)
     */
    private updating: boolean = false;
    /**
     * Possible callback when the update completes
     */
    private updateComplete: (() => void) | null = null;
    /**
     * Whether we should auto-save the file
     */
    public autosave: boolean = true;

    public constructor(private location: string, private defaults: T) {
    }

    /**
     * Loads the config file from FS
     */
    public async load(): Promise<void> {
        await this.ensureExists();
        this.conf = await fs.readJSON(this.location);
    }

    /**
     * Shuts down the config loader
     */
    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.autosave = false;
            if (this.updating) {
                this.updateComplete = () => resolve();
                return;
            }
            resolve();
        });
    }

    /**
     * The config object
     */
    public get config(): T {
        return this.conf ? proxy(this.conf, () => this.configWasUpdated()) : readOnly(this.defaults);
    }

    public set config(newConfig: T) {
        if (util.types.isProxy(newConfig)) {
            
        }
    }

    /**
     * Saves the file to the FS
     */
    public save(): Promise<void> {
        return fs.writeJSON(this.location, this.rawConfig);
    }

    /**
     * Returns a raw, unproxied config object
     */
    private get rawConfig(): T {
        return this.conf || readOnly(this.defaults);
    }

    /**
     * Called when a property on the config object was modified, saves it to FS
     */
    private async configWasUpdated(): Promise<void> {
        if (this.updating || !this.autosave) {
            return;
        }
        this.updating = true;
        await this.save();
        this.updating = false;
        if (this.updateComplete) {
            this.updateComplete();
        }
    }

    /**
     * Creates the file if it doesn't exist and writes defaults
     */
    private async ensureExists(): Promise<void> {
        if (await this.fileExists()) {
            return;
        }
        await fs.writeJSON(this.location, this.defaults);
    }

    /**
     * Returns whether the file exists on FS
     */
    private fileExists(): Promise<boolean> {
        return fs.pathExists(this.location);
    }
}