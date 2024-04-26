import { IDocumentStore } from "../../../src/index.js";
import { disposeTestDocumentStore, testContext } from "../../Utils/TestUtil.js";
import { User } from "../../Assets/Entities.js";
import { assertThat } from "../../Utils/AssertExtensions.js";

describe("RDBC_440", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () =>
        await disposeTestDocumentStore(store));

    it("can load just added entity", async () => {
        const session = store.openSession();
        const user1 = Object.assign(new User(), {
            name: "Marcin",
            id: "users/1"
        });

        await session.store(user1);
        const loadedUser = await session
            .include("addressId")
            .load("users/1")

        assertThat(loadedUser)
            .isSameAs(user1);
    });
});