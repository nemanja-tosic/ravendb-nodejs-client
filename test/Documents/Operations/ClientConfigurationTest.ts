import assert from "node:assert"
import {
    testContext,
    disposeTestDocumentStore, RavenTestContext
} from "../../Utils/TestUtil";

import {
    ClientConfiguration,
    GetClientConfigurationOperation,
    IDocumentStore, IRavenResponse, PutClientConfigurationOperation,
    PutServerWideClientConfigurationOperation,
    GetServerWideClientConfigurationOperation
} from "../../../src";
import { assertThat } from "../../Utils/AssertExtensions";

(RavenTestContext.isPullRequest ? describe.skip : describe)("Client configuration", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () =>
        await disposeTestDocumentStore(store));

    it("canSaveAndReadServerWideClientConfiguration", async () => {
        const configurationToSave: ClientConfiguration = {
            maxNumberOfRequestsPerSession: 80,
            readBalanceBehavior: "FastestNode",
            disabled: true,
            loadBalanceBehavior: "None",
            loadBalancerContextSeed: 0
        };

        const saveOperation = new PutServerWideClientConfigurationOperation(configurationToSave);

        await store.maintenance.server.send(saveOperation);

        const operation = new GetServerWideClientConfigurationOperation();
        const newConfiguration = await store.maintenance.server.send(operation);

        assertThat(newConfiguration)
            .isNotNull();
        assertThat(newConfiguration.disabled)
            .isTrue();
        assertThat(newConfiguration.maxNumberOfRequestsPerSession)
            .isEqualTo(80);
        assertThat(newConfiguration.loadBalancerContextSeed)
            .isEqualTo(0);
        assertThat(newConfiguration.loadBalanceBehavior)
            .isEqualTo("None");
        assertThat(newConfiguration.readBalanceBehavior)
            .isEqualTo("FastestNode");
    });

    it("can handle no configuration", async () => {
        const operation = new GetClientConfigurationOperation();
        const result: IRavenResponse = await store.maintenance.send(operation);
        assert.ok(result.etag);
    });

    it("can save and read client configuration", async () => {
        const configurationToSave: ClientConfiguration = {
            etag: 123,
            maxNumberOfRequestsPerSession: 80,
            readBalanceBehavior: "FastestNode",
            disabled: true
        };

        const saveOperation = new PutClientConfigurationOperation(configurationToSave);
        await store.maintenance.send(saveOperation);

        const operation = new GetClientConfigurationOperation();
        const result = await store.maintenance.send(operation);
        const configuration = result.configuration;
        assert.ok(configuration.etag);
        assert.ok(configuration.disabled);
        assert.strictEqual(configuration.maxNumberOfRequestsPerSession, 80);
        assert.strictEqual(configuration.readBalanceBehavior, "FastestNode");
    });
});
