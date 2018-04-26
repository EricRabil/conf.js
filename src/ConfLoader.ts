import fs = require("fs-extra");

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

export class ConfigLoader<T extends object> {

    private conf: T | null = null;
    private updating: boolean = false;
    private updateComplete: (() => void) | null = null;
    public autoUpdate: boolean = true;

    public constructor(private location: string, private defaults: T) {
    }

    public async load(): Promise<void> {
        await this.ensureExists();
        this.conf = await fs.readJSON(this.location);
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.autoUpdate = false;
            if (this.updating) {
                this.updateComplete = () => resolve();
                return;
            }
            resolve();
        });
    }

    public get config(): T {
        return this.conf ? proxy(this.conf, () => this.configWasUpdated()) : readOnly(this.defaults);
    }

    public save(): Promise<void> {
        return fs.writeJSON(this.location, this.rawConfig);
    }

    private get rawConfig(): T {
        return this.conf || readOnly(this.defaults);
    }

    private async configWasUpdated(): Promise<void> {
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

    private async ensureExists(): Promise<void> {
        if (await this.fileExists()) {
            return;
        }
        await fs.writeJSON(this.location, this.defaults);
    }

    private fileExists(): Promise<boolean> {
        return fs.pathExists(this.location);
    }
}