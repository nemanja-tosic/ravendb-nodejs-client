import {
    DocumentStore,
} from "../../src/index.js";
import { IAuthOptions } from "../../src/Auth/AuthOptions.js";
import assert from "node:assert"

describe("[RDBC-202] DocumentStore", function () {

    it("allows to pass authOptions as a third param in DocumentStore constructor", () => {
        const authOptions: IAuthOptions = {};
        const store = new DocumentStore("https://test.com", "db", authOptions);
        assert.strictEqual(store.authOptions, authOptions);
    });

});
