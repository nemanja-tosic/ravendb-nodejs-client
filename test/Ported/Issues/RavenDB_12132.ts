import { User } from "../../Assets/Entities.js";
import { assertThat } from "../../Utils/AssertExtensions.js";
import { testContext, disposeTestDocumentStore } from "../../Utils/TestUtil.js";

import {
    IDocumentStore,
    PutCompareExchangeValueOperation,
    SessionOptions,
} from "../../../src/index.js";

describe("RavenDB-12132", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () => 
        await disposeTestDocumentStore(store));

    it("canPutObjectWithId", async () => {
        {
            const user = Object.assign(new User(), { id: "users/1", name: "Grisha" });
           
            const res = await store.operations.send(
                new PutCompareExchangeValueOperation<User>("test", user, 0));

            assertThat(res.successful)
                    .isTrue();

            assertThat(res.value.name)
                    .isEqualTo("Grisha");
            assertThat(res.value.id)
                    .isEqualTo("users/1");

        }
    });

    it("canCreateClusterTransactionRequest1", async function () {
            const user = Object.assign(new User(), { id: "this/is/my/id", name: "Grisha" });
            const sessionOpts = { transactionMode: "ClusterWide" } as SessionOptions;
            
            const session = store.openSession(sessionOpts);
            session.advanced.clusterTransaction.createCompareExchangeValue<User>("usernames/ayende", user);
            await session.saveChanges();
            const userFromCluster = (await session.advanced.clusterTransaction
                .getCompareExchangeValue("usernames/ayende", User)).value;
            assertThat(userFromCluster.name)
                .isEqualTo(user.name);
            assertThat(userFromCluster.id)
                .isEqualTo(user.id);
            assertThat(userFromCluster instanceof User)
                .isTrue();
    });
});
