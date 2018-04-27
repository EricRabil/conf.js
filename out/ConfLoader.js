"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const util_1 = __importDefault(require("util"));
/**
 * Creates an object which calls an update method whenever any key anywhere on the object is updated.
 * @param object the object to proxy
 * @param update the update method
 */
function proxy(object, update) {
    const proxyObj = new Proxy(object, {
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
function readOnly(object) {
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
class ConfigLoader {
    constructor(location, defaults) {
        this.location = location;
        this.defaults = defaults;
        /**
         * The raw config, from the file
         */
        this.conf = null;
        /**
         * Whether we are in the middle of the update (to not save in the middle of another save)
         */
        this.updating = false;
        /**
         * Possible callback when the update completes
         */
        this.updateComplete = null;
        /**
         * Whether we should auto-save the file
         */
        this.autosave = true;
    }
    /**
     * Loads the config file from FS
     */
    async load() {
        await this.ensureExists();
        this.conf = await fs.readJSON(this.location);
    }
    /**
     * Shuts down the config loader
     */
    close() {
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
    get config() {
        return this.conf ? proxy(this.conf, () => this.configWasUpdated()) : readOnly(this.defaults);
    }
    set config(newConfig) {
        if (util_1.default.types.isProxy(newConfig)) {
        }
    }
    /**
     * Saves the file to the FS
     */
    save() {
        return fs.writeJSON(this.location, this.rawConfig);
    }
    /**
     * Returns a raw, unproxied config object
     */
    get rawConfig() {
        return this.conf || readOnly(this.defaults);
    }
    /**
     * Called when a property on the config object was modified, saves it to FS
     */
    async configWasUpdated() {
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
    async ensureExists() {
        if (await this.fileExists()) {
            return;
        }
        await fs.writeJSON(this.location, this.defaults);
    }
    /**
     * Returns whether the file exists on FS
     */
    fileExists() {
        return fs.pathExists(this.location);
    }
}
exports.ConfigLoader = ConfigLoader;
