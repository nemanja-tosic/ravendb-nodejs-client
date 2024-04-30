import { IDocumentStore } from "../../../src/index.js";
import { disposeTestDocumentStore, testContext } from "../../Utils/TestUtil.js";
import { User } from "../../Assets/Entities.js";
import { assertThat, assertThrows } from "../../Utils/AssertExtensions.js";

describe("RavenDB_16906", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () =>
        await disposeTestDocumentStore(store));

    it("timeSeriesFor_ShouldThrowBetterError_OnNullEntity", async () => {
        const session = store.openSession();
        const user = await session.load("users/1", User);
        await assertThrows(() => session.timeSeriesFor(user, "heartRate"), err => {
            assertThat(err.name)
                .isEqualTo("InvalidArgumentException");
            assertThat(err.message)
                .contains("Entity cannot be null");
        });
    });
});