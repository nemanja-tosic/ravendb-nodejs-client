import { IDocumentStore } from "../../../src/index.js";
import { disposeTestDocumentStore, testContext } from "../../Utils/TestUtil.js";
import { Company } from "../../Assets/Orders.js";
import { assertThat } from "../../Utils/AssertExtensions.js";

describe("RavenDB_15690Test", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () =>
        await disposeTestDocumentStore(store));

    it("hasChanges_ShouldDetectDeletes", async () => {
        {
            const session = store.openSession();
            const company = new Company();
            company.name = "HR";
            await session.store(company, "companies/1");
            await session.saveChanges();
        }

        {
            const session = store.openSession();

            const company = await session.load("companies/1", Company);
            await session.delete(company);

            const changes = session.advanced.whatChanged();
            assertThat(changes)
                .hasSize(1);
            assertThat(session.advanced.hasChanges())
                .isTrue();
        }
    });
});