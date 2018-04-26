"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
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
class ConfigLoader {
    constructor(location, defaults) {
        this.location = location;
        this.defaults = defaults;
        this.conf = null;
        this.updating = false;
        this.updateComplete = null;
        this.autoUpdate = true;
    }
    async load() {
        await this.ensureExists();
        this.conf = await fs.readJSON(this.location);
    }
    close() {
        return new Promise((resolve, reject) => {
            this.autoUpdate = false;
            if (this.updating) {
                this.updateComplete = () => resolve();
                return;
            }
            resolve();
        });
    }
    get config() {
        return this.conf ? proxy(this.conf, () => this.configWasUpdated()) : readOnly(this.defaults);
    }
    save() {
        return fs.writeJSON(this.location, this.rawConfig);
    }
    get rawConfig() {
        return this.conf || readOnly(this.defaults);
    }
    async configWasUpdated() {
        if (this.updating || !this.autoUpdate) {
            return;
        }
        this.updating = true;
        await this.save();
        this.updating = false;
        if (this.updateComplete) {
            this.updateComplete();
        }
    }
    async ensureExists() {
        if (await this.fileExists()) {
            return;
        }
        await fs.writeJSON(this.location, this.defaults);
    }
    fileExists() {
        return fs.pathExists(this.location);
    }
}
exports.ConfigLoader = ConfigLoader;
