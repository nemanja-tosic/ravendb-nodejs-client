import assert from "node:assert"
import { testContext, disposeTestDocumentStore } from "../Utils/TestUtil.js";

import {
    IDocumentStore,
} from "../../src/index.js";
import { TypeUtil } from "../../src/Utility/TypeUtil.js";

describe("TypeUtil", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () => 
        await disposeTestDocumentStore(store));

    it("isClass()", async () => {
        assert.ok(TypeUtil.isClass(class Test {}));

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        assert.ok(!TypeUtil.isClass(function () {}));

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        assert.ok(!TypeUtil.isClass(() => {}));
        assert.ok(!TypeUtil.isClass(1));
        assert.ok(!TypeUtil.isClass("test"));

        assert.ok(!TypeUtil.isClass(Symbol("test")));
    });
});
