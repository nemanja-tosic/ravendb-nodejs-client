import * as assert from "node:assert";
import { testContext, disposeTestDocumentStore } from "../../Utils/TestUtil";
import { CreateSampleDataOperation } from "../../Utils/CreateSampleDataOperation";

import {
    GetStatisticsCommand, GetStatisticsOperation,
    IDocumentStore,
} from "../../../src";
import { User } from "../../Assets/Entities";
import moment = require("moment");
import { assertThat } from "../../Utils/AssertExtensions";

describe("GetStatisticsCommand()", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () =>
        await disposeTestDocumentStore(store));

    it("can get stats", async () => {
        const getStatsCmd = new GetStatisticsCommand();
        const executor = store.getRequestExecutor();

        const sampleDataOp = new CreateSampleDataOperation([
            "Documents",
            "Indexes",
            "Attachments",
            "RevisionDocuments"
        ]);
        await store.maintenance.send(sampleDataOp);

        await testContext.waitForIndexing(store, store.database, null);
        await executor.execute(getStatsCmd);

        const stats = getStatsCmd.result;
        assert.ok(stats);

        assert.ok(stats.lastDocEtag);
        assert.ok(stats.lastDocEtag > 0);

        assert.ok(stats.countOfIndexes >= 3);

        assert.strictEqual(stats.countOfDocuments, 1059);
        assert.ok(stats.countOfRevisionDocuments > 0);
        assert.strictEqual(stats.countOfDocumentsConflicts, 0);
        assert.strictEqual(stats.countOfUniqueAttachments, 17);

        assert.ok(stats.databaseChangeVector);
        assert.ok(stats.databaseId);
        assert.ok(stats.pager);
        assert.ok(stats.lastIndexingTime);
        assert.ok(stats.indexes);
        assert.ok(stats.sizeOnDisk.humaneSize);
        assert.ok(stats.sizeOnDisk.sizeInBytes);

        for (const idx of stats.indexes) {
            assert.ok(idx.name);
            assert.ok(idx.isStale === false, `Index ${idx.name} is stale`);
            assert.ok(idx.state);
            assert.ok(idx.lockMode);
            assert.ok(idx.priority);
            assert.ok(idx.type);
            assert.ok(idx.lastIndexingTime);
        }
    });

    it("canGetStatsForCountersAndTimeSeries", async () => {
        {
            const session = store.openSession();

            await session.store(new User(), "users/1");

            session.countersFor("users/1")
                .increment("c1");

            session.countersFor("users/1")
                .increment("c2");

            const tsf = session.timeSeriesFor("users/1", "Heartrate");
            tsf.append(new Date(), 70);

            tsf.append(moment().add(1, "minute").toDate(), 20);

            await session.saveChanges();
        }

        const statistics = await store.maintenance.send(new GetStatisticsOperation());

        assertThat(statistics.countOfCounterEntries)
            .isEqualTo(1);
        assertThat(statistics.countOfTimeSeriesSegments)
            .isEqualTo(1);
    });

});
