import {ConfigLoader} from "./ConfLoader";
import fs = require("fs-extra");
import path = require("path");
import util = require("util");

const TEST_PATH = path.join(__dirname, "test.json");
const TEST_DATA = {
    i: {
        dont: {
            want: {
                to: {
                    do: {
                        the: {
                            work: {
                                today: "i dont want to do the work today"
                            }
                        }
                    }
                }
            },
            really: {
                want: {
                    to: {
                        do: {
                            the: {
                                work: {
                                    today: "i dont really want to do the work today"
                                }
                            }
                        }
                    }
                },
            }
        }
    }
}
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

if (fs.pathExistsSync(TEST_PATH)) {
    fs.removeSync(TEST_PATH);
}

let confLoader = new ConfigLoader(TEST_PATH, TEST_DATA);
let confLoader2 = new ConfigLoader(TEST_PATH, TEST_DATA);
confLoader.load().then(() => {
    console.log(util.inspect(confLoader.config));
    console.log("Making mutation");
    confLoader.config.i.dont.really.want.to.do.the.work.today = "no wait i really want to do the work today";
}).then(() => sleep(3000)).then(() => {
    console.log("I DONT WANT TO");
});