import * as assert from "assert";
import { testContext, disposeTestDocumentStore } from "../../Utils/TestUtil";

import {
    DocumentStore,
    IDocumentSession,
    IDocumentStore,
} from "../../../src";
import * as stream from "readable-stream";
import { User } from "../../Assets/Entities";
import {CONSTANTS} from "../../../src/Constants";
import {IMetadataDictionary} from "../../../src/Documents/Session/IMetadataDictionary";
import {DeleteCommandData} from "../../../src/Documents/Commands/CommandData";

describe("Attachments Session", function () {

    let store: IDocumentStore;

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
    });

    afterEach(async () =>
        await disposeTestDocumentStore(store));

    it("can put attachments", async () => {
        const names = [ "profile.png", "background-photo.jpg", "fileNAME_#$1^%_בעברית.txt" ];

        const profileStream = Buffer.from([1, 2, 3]);
        const backgroundStream = Buffer.from([10, 20, 30, 40, 50]);
        const fileStream = new stream.Readable();
        fileStream.push(1);
        fileStream.push(2);
        fileStream.push(3);
        fileStream.push(4);
        fileStream.push(5);
        fileStream.push(null);

        {
            const session = store.openSession();

            const user = new User();
            user.name = "Fitzchak";

            await session.store(user, "users/1");
            session.advanced.attachments.store("users/1", names[0], profileStream, "image/png");
            session.advanced.attachments.store(user, names[1], backgroundStream, "ImGgE/jPeG");
            session.advanced.attachments.store(user, names[2], fileStream);
            await session.saveChanges();
        }

        {
            const session = store.openSession();

            const user = await session.load<User>("users/1");
            const metadata = session.advanced.getMetadataFor(user);
            assert.strictEqual(metadata[CONSTANTS.Documents.Metadata.FLAGS], "HasAttachments");

            const attachments = metadata[CONSTANTS.Documents.Metadata.ATTACHMENTS];
            assert.strictEqual(3, attachments.length);

            const orderedNames = attachments.map(x => x.name);
            orderedNames.sort();

            for (let i = 0; i < names.length; i++) {
                const name = orderedNames[i];
                const attachment = attachments[i] as IMetadataDictionary;
                assert.strictEqual(name, attachment.get("name"));
            }
        }
    });

    it("throws if stream is used twice", async() => {
        const session = store.openSession();
        const stream = Buffer.from([1, 2, 3]);

        const user = new User();
        user.name = "Fitzchak";

        await session.store(user, "users/1");
        session.advanced.attachments.store(user, "profile", stream, "image/png");
        session.advanced.attachments.store(user, "other", stream);

        try {
            await session.saveChanges();
            assert.fail("it should have thrown");
        } catch (err) {
            assert.strictEqual(err.name, "InvalidOperationException");
        }
    });

    it("throws when two attachments with the same name in session", async() => {
        const session = store.openSession();
        const stream = Buffer.from([1, 2, 3]);
        const stream2 = Buffer.from([1, 2, 3, 4, 5]);

        const user = new User();
        user.name = "Fitzchak";
        await session.store(user, "users/1");
        session.advanced.attachments.store(user, "profile", stream, "image/png");

        try {
            session.advanced.attachments.store(user, "profile", stream2);
            assert.fail("it should have thrown");
        } catch (err) {
            assert.strictEqual(err.name, "InvalidOperationException");
        }
    });

    it("should throw when deleting attachment after put document and attachment", async () => {
        const session = store.openSession();

        const stream = Buffer.from([1, 2, 3]);
        const user = new User();
        user.name = "Fitzchak";
        await session.store(user, "users/1");
        session.advanced.attachments.store(user, "profile", stream, "image/png");
        await session.delete(user);

        try {
            await session.saveChanges();
            assert.fail("it should have thrown");
        } catch (err) {
            assert.strictEqual(err.name, "InvalidOperationException");
        }
    });

    it("can delete attachments", async () => {
        {
            const session = store.openSession();

            const user = new User();
            user.name = "Fitzchak";
            await session.store(user, "users/1");

            const stream1 = Buffer.from([1, 2, 3]);
            const stream2 = Buffer.from([1, 2, 3, 4, 5, 6]);
            const stream3 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const stream4 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

            session.advanced.attachments.store(user, "file1", stream1, "image/png");
            session.advanced.attachments.store(user, "file2", stream2, "image/png");
            session.advanced.attachments.store(user, "file3", stream3, "image/png");
            session.advanced.attachments.store(user, "file4", stream4, "image/png");
            await session.saveChanges();
        }

        {
            const session = store.openSession();
            const user = await session.load<User>("users/1");
            session.advanced.attachments.delete("users/1", "file2");
            session.advanced.attachments.delete(user, "file4");
            await session.saveChanges();
        }

        {
            const session = store.openSession();
            const user  = await session.load<User>("users/1");
            const metadata = session.advanced.getMetadataFor(user);
            assert.strictEqual(metadata[CONSTANTS.Documents.Metadata.FLAGS], "HasAttachments");

            const attachments = metadata[CONSTANTS.Documents.Metadata.ATTACHMENTS];
            assert.strictEqual(attachments.length, 2);

            const result = session.advanced.attachments.get("users/1", "file1");
            assert.strictEqual(result.data.length, 3);

        }
    });

    it.skip("can release attachment resources", () => {
        //TODO: this tests uses: https://github.com/ravendb/ravendb-jvm-client/blob/9e979755cdac917be5eed3ee9eb61cadc5e92e58/src/main/java/net/ravendb/client/test/driver/RavenTestDriver.java#L161
        // I'm not sure we can do this in node.js
    });

    it("delete document and then its attachments. This is no op but should be supported.", async () => {
        {
            const session = store.openSession();

            const user = new User();
            user.name = "Fitzchak";
            await session.store(user, "users/1");

            const stream = Buffer.from([1, 2, 3]);
            session.advanced.attachments.store(user, "file", stream, "image/png");
            await session.saveChanges();
        }

        {
            const session = store.openSession();
            const user = session.load<User>("users/1");
            await session.delete(user);
            session.advanced.attachments.delete(user, "file");
            session.advanced.attachments.delete(user, "file"); // this should be no-op
            await session.saveChanges();
        }
    });

    it("delete document by command and then its attachments. This is no op but should be supported.", async () => {
        {
            const session = store.openSession();

            const user = new User();
            user.name = "Fitzchak";
            await session.store(user, "users/1");

            const stream = Buffer.from([1, 2, 3]);
            session.advanced.attachments.store(user, "file", stream, "image/png");
            await session.saveChanges();
        }

        {
            const session = store.openSession();
            session.advanced.defer(new DeleteCommandData("users/1", null));
            session.advanced.attachments.delete("users/1", "file");
            session.advanced.attachments.delete("users/1", "file");
            await session.saveChanges();
        }
    });

    it("get attachment names", async () => {
        const names = ["profile.png"];
        {
            const session = store.openSession();

            const user = new User();
            user.name = "Fitzchak";
            await session.store(user, "users/1");

            const stream = Buffer.from([1, 2, 3]);
            session.advanced.attachments.store(user, names[0], stream, "image/png");
            await session.saveChanges();
        }

        {
            const session = store.openSession();

            const user = session.load<User>("users/1");
            const attachments = session.advanced.attachments.getNames(user);
            assert.strictEqual(attachments.length, 1);

            const attachment = attachments[0];
            assert.strictEqual(attachment.contentType, "image/png");
            assert.strictEqual(attachment.name, names[0]);
            assert.strictEqual(attachment.size, 3);
        }
    });

    it("attachment exists", async () => {
        {
            const session = store.openSession();

            const user = new User();
            user.name = "Fitzchak";
            await session.store(user, "users/1");

            const stream = Buffer.from([1, 2, 3]);
            session.advanced.attachments.store(user, "profile", stream, "image/png");
            await session.saveChanges();
        }

        {
            const session = store.openSession();
            assert.ok(session.advanced.attachments.exists("users/1", "profile"));
            assert.ok(!session.advanced.attachments.exists("users/1", "background-photo"));
            assert.ok(!session.advanced.attachments.exists("users/2", "profile"));
        }
    });
});