import * as stream from "readable-stream";
import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import { testContext, disposeTestDocumentStore } from "../Utils/TestUtil";
import * as util from "util";

import DocumentStore, {
    IDocumentStore,
    IDocumentQuery,
    IDocumentSession,
    QueryStatistics,
    StreamQueryStatistics,
    LoadOptions,
} from "../../src";
import { TypeUtil } from "../../src/Utility/TypeUtil";
import { AbstractJavaScriptIndexCreationTask } from "../../src/Documents/Indexes/AbstractJavaScriptIndexCreationTask";
import {CONSTANTS} from "../../src/Constants";

// eslint-disable-next-line no-console
let print = console.log;
print = TypeUtil.NOOP;

describe("Readme samples", function () {

    let store: IDocumentStore;
    let session: IDocumentSession;

    let data: any[];
    let query: IDocumentQuery<any>;
    let results: any;

    class User {
        public name: string;
        public age: number;
        public registeredAt: Date;

        constructor(opts: object) {
            opts = opts || {};
            Object.assign(this, opts);
        }
    }

    beforeEach(async function () {
        store = await testContext.getDocumentStore();
        session = store.openSession();
        results = null;
    });

    afterEach(async () =>
        await disposeTestDocumentStore(store));

    describe("asyncCallType", async () => {
        
        it("async and await", async () => {
            const user = { id: null, name: 'John' };
            await session.store(user, 'users/1-A');
            await session.saveChanges();
            assert.strictEqual(user.id, 'users/1-A');

            const userEntity: User = await session.load('users/1-A');
            userEntity.name = 'Mark';
            await session.saveChanges();

            const userEntity2: User = await session.load('users/1-A');
            assert.strictEqual(user.name, 'Mark');
        });
    });
    
    describe("thenCallType", () => {
        
        it("then and callbacks", (done) => {
            session.store({ id: null, name: 'John' }, 'users/1-A')
                .then(() => {
                    return session.saveChanges();
                })
                .then(() => {
                    return session.load('users/1-A')
                })
                .then((user: User) => {
                    user.name = 'Mark';
                })
                .then(() => {
                    return session.saveChanges();
                })
                .then(() => {
                    return session.load('users/1-A');
                })
                .then((user: User) => {
                    assert.strictEqual(user.name, 'Mark');
                })
                .then(() => {
                    done();
                });
        });
    });
    
    describe("with data set with includes", function () {

        beforeEach(async function () {
            data = [
                new User({
                    name: "John",
                    age: 30,
                    registeredAt: new Date(2017, 10, 11),
                    kids: ["users/2", "users/3"]
                }),
                new User({
                    name: "Stefanie",
                    age: 25,
                    registeredAt: new Date(2015, 6, 30)
                }),
                new User({
                    name: "Thomas",
                    age: 25,
                    registeredAt: new Date(2016, 3, 25)
                })
            ];

            const newSession = store.openSession();
            for (let i = 0; i < data.length; i++) {
                await newSession.store(data[i], `users/${i + 1}`);
            }

            await newSession.saveChanges();
        });

        it("loading data with include()", async () => {
            // users/1
            // {
            //      "name": "John",
            //      "kids": ["users/2", "users/3"]
            // }
            
            const session = store.openSession();
            const user1 = await session
                .include("kids")
                .load("users/1");
                // Document users/1 and all docs referenced in "kids"
                // will be fetched from the server in a single request.

            const user2 = await session.load("users/2"); // this won't call server again
            assert.ok(user1);
            assert.ok(user2);
            assert.strictEqual(session.advanced.numberOfRequests, 1);
        });

        it("loading data with passing includes", async () => {
            // users/1
            // {
            //      "name": "John",
            //      "kids": ["users/2", "users/3"]
            // }
            
            const session = store.openSession();
            const user1 = await session
                .load("users/1", { includes: [ "kids" ] } as LoadOptions<any>);
                // Document users/1 and all docs referenced in "kids"
                // will be fetched from the server in a single request.

            const user2 = await session.load("users/2"); // this won't call server again
            assert.ok(user1);
            assert.ok(user2);
            assert.strictEqual(session.advanced.numberOfRequests, 1);
        });
    });

    describe("update documents", async () => {
        
        it("update document", async () => {
            let product = {
                id: null,
                title: 'iPhone X',
                price: 999.99,
                currency: 'USD',
                storage: 64,
                manufacturer: 'Apple',
                in_stock: true,
                last_update: new Date('2017-10-01T00:00:00')
            };
            
            const docId = "products/1-A";

            await session.store(product, docId);
            assert.strictEqual(product.id, docId);
            
            await session.saveChanges();
            assert.strictEqual(product.id, docId);

            product = await session.load(docId);
            product.in_stock = false;
            product.storage = 42;
            await session.saveChanges();

            product = await session.load(docId);
            assert.strictEqual(product.in_stock, false);
            assert.strictEqual(product.storage, 42);
        });
    });

    describe("attachments", () => {
        
        it("store attachment", async () => {
            const doc = new User({
                name: "John"
            });

            // track entity
            await session.store(doc);

            // open and store attachment
            const fileStream = fs.createReadStream(path.join(__dirname, "../Assets/tubes.png"));
            session.advanced.attachments.store(doc, "tubes.png", fileStream, "image/png");

            await session.saveChanges();
        });

        describe("having attachment", () => {

            let doc;
            const attachmentPath = path.join(__dirname, "../Assets/tubes.png");
            const attachmentName = "tubes.png";

            beforeEach(async () => {

                doc = new User({
                    name: "John"
                });

                // track entity
                await session.store(doc);

                // open and store attachment
                const fileStream = fs.createReadStream(attachmentPath);
                session.advanced.attachments.store(doc, attachmentName, fileStream, "image/png");

                await session.saveChanges();
                fileStream.close();
            });

            it("get attachment", (done) => {
                session.advanced.attachments.get(doc.id, attachmentName)
                    .then(attachment => {
                        print(attachment.details);
                        assert.strictEqual(attachment.details.name, attachmentName)
                        
                        // attachment.data is a Readable
                        attachment.data
                            .pipe(fs.createWriteStream("test/tubes.png"))
                            .on("error", done)
                            .on("finish", () => {
                                attachment.dispose();
                                done();
                            });
                    });
            });

            it("attachment exists", async () => {
                let attachmentExists = await session.advanced.attachments.exists(doc.id, attachmentName);
                assert.strictEqual(attachmentExists, true);
                
                attachmentExists = await session.advanced.attachments.exists(doc.id, "x.png");
                assert.strictEqual(attachmentExists, false);
            });

            it("get attachment names", async () => {
                {
                    const session2 = store.openSession();
                    const entity = await session2.load(doc.id);
                    const names = await session2.advanced.attachments.getNames(entity);
                    assert.strictEqual(names[0].name, attachmentName)
                }
            });
        });
    });

    describe("bulk insert", async () => {
        
        it("bulk insert example", async () => {
            // create bulk insert instance using DocumentStore instance
            const bulkInsert = store.bulkInsert();

            // insert your documents
            for (const name of ["Anna", "Maria", "Miguel", "Emanuel", "Dayanara", "Aleida"]) {
                const user = new User({ name });
                await bulkInsert.store(user);
                print(user);
            }

            // flush data and finish
            await bulkInsert.finish();

            {
                session = store.openSession();
                const userEntity: User = await session.load('users/2-A');
                assert.strictEqual(userEntity.name, "Maria");
                
                const users = await session.query({ collection: 'users'}).all();
                assert.strictEqual(users.length, 6);
            }
        });
    });

    describe("changes", () => {

        it("listen to changes", async () => {
            const changes = store.changes();
            const docsChanges = changes.forDocumentsInCollection("users");
            
            docsChanges.on("data", change => {
                print(change);
                changes.dispose();
            });

            {
                const session2 = store.openSession();
                await session2.store(new User({ name: "Starlord" }));
                await session2.saveChanges();
            }

            return new Promise(resolve => setTimeout(() => {
                resolve();
            }, 300));
        });
    });

    describe("with user data set", function () {

        beforeEach(async () => prepareUserDataSet(store));

        afterEach(async () => {
            if (query && results) {
                print("// RQL");
                print("// " + query.getIndexQuery().query);
                print("// ", query.getIndexQuery().queryParameters);
                results.forEach(x => delete x["@metadata"]);
                print("// " + util.inspect(results));
            }
        });

        it("projections single field", async () => {
            query = session.query({ collection: "users" })
                .selectFields("name");
            
            results = await query.all();
            assert.strictEqual(results[0], "John");
        });

        it("projections multiple fields", async () => {
            query = session.query({ collection: "users" })
                .selectFields(["name", "age"]);
            
            results = await query.all();
            
            const keys = Object.keys(results[2]);
            assert.strictEqual(results[2][keys[0]], "Thomas");
            assert.strictEqual(results[2][keys[1]], 25);
        });

        it("distinct", async () => {
            query = session.query({ collection: "users" })
                .selectFields("age")
                .distinct();
            
            results = await query.all();
            assert.strictEqual(results.length, 2);
        });

        it("where equals", async () => {
            query = session.query({ collection: "users" })
                .whereEquals("age", 30);
            
            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("where in", async () => {
            query = session.query({ collection: "users" })
                .whereIn("name", ["John", "Thomas"]);
            
            results = await query.all();
            assert.strictEqual(results.length, 2);
        });

        it("where between", async () => {
            query = session.query({ collection: "users" })
                .whereBetween("registeredAt", new Date(2016, 0, 1), new Date(2017, 0, 1));
            
            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("where greater than", async () => {
            query = session.query({ collection: "users" })
                .whereGreaterThan("age", 29);
            
            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("where exists", async () => {
            query = session.query({ collection: "users" })
                .whereExists("kids");
            
            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("where contains any", async () => {
            query = session.query({ collection: "users" })
                .containsAny("kids", ["Mara"]);
            
            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("search()", async () => {
            query = session.query({ collection: "users" })
                .search("kids", "Mara John");
            
            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("subclause", async () => {
            query = session.query({ collection: "users" })
                .whereExists("kids")
                .orElse()
                .openSubclause()
                .whereEquals("age", 25)
                .whereNotEquals("name", "Thomas")
                .closeSubclause();
            
            results = await query.all();
            assert.strictEqual(results.length, 2);
        });

        it("not()", async () => {
            query = await session.query({ collection: "users" })
                .not()
                .whereEquals("age", 25);
            
            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("orElse", async () => {
            query = await session.query({ collection: "users" })
                .whereExists("kids")
                .orElse()
                .whereLessThan("age", 30);
            
            results = await query.all();
            assert.strictEqual(results.length, 3);
        });

        it("set default operator", async () => {
            query = await session.query({collection: "users"})
                .usingDefaultOperator("OR") // override the default 'AND' operator
                .whereExists("kids")
                .whereLessThan("age", 29)
            
            results = await query.all();            
            assert.strictEqual(results.length, 3);
        });

        it("orderBy()", async () => {
            query = await session.query({ collection: "users" })
                .orderBy("age");

            results = await query.all();
            
            assert.strictEqual(results.length, 3);
            assert.strictEqual(results[0].age, 25);
        });

        it("orderByDesc()", async () => {
            query = await session.query({ collection: "users" })
                .orderByDescending("age");

            results = await query.all();

            assert.strictEqual(results.length, 3);
            assert.strictEqual(results[0].age, 30);
        });

        it("take()", async () => {
            query = await session.query({ collection: "users" })
                .orderBy("age")
                .take(2);

            results = await query.all();
            assert.strictEqual(results.length, 2);
        });

        it("skip()", async () => {
            query = await session.query({ collection: "users" })
                .orderBy("age")
                .take(1)
                .skip(1);

            results = await query.all();
            assert.strictEqual(results.length, 1);
        });

        it("can get stats", async () => {
            let stats: QueryStatistics;
            query = session.query({ collection: "users" })
                .whereGreaterThan("age", 29)
                .statistics(s => stats = s);
            results = await query.all();
            
            assert.ok(stats);
            assert.strictEqual(stats.totalResults, 1);
            assert.strictEqual(stats.skippedResults, 0);
            assert.strictEqual(stats.indexName, "Auto/users/Byage");
            assert.strictEqual(stats.isStale, false);
            assert.ok(stats.resultEtag);
            assert.ok(stats.durationInMs);
            assert.ok(stats.lastQueryTime instanceof Date);
            assert.ok(stats.timestamp instanceof Date);
            assert.ok(stats.indexTimestamp instanceof Date);
        });

        it("can stream users by prefix", async () => {
            const result: any = [];

            const userStream = await session.advanced.stream<User>("users/");
            userStream.on("data", user => {
                result.push(user);
                print(user);
                // ...
            });

            userStream.on("end", () => {
                assert.ok(result.length);
            });

            await new Promise<void>((resolve, reject) => {
                stream.finished(userStream, err => {
                    err ? reject(err) : resolve();
                });
            });
        });

        it("can stream query and get stats", async () => {
            let stats: StreamQueryStatistics;
            const items = [];
            query = session.query({ collection: "users" })
                .whereGreaterThan("age", 29);
            const queryStream = await session.advanced.stream(query, _ => stats = _);

            queryStream.on("data", user => {
                print(user);
                items.push(user);
                // ...
            });

            queryStream.once("stats", stats => {
                print("STREAM STATS", stats);
                // ...
            });

            await new Promise<void>((resolve, reject) => {
                queryStream.on("end", () => {
                    try {
                        assert.ok(items.length);
                        assert.ok(stats);
                        assert.strictEqual(stats.totalResults, 1);
                        assert.strictEqual(stats.indexName, "Auto/users/Byage");
                        assert.ok(stats.resultEtag);
                        assert.ok(stats.indexTimestamp instanceof Date);
                    } catch (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        });

        it("can suggest", async () => {
            class UsersIndex extends AbstractJavaScriptIndexCreationTask<User, Pick<User, "name">> {
                constructor() {
                    super();
                    this.map(User, doc => {
                        return {
                            name: doc.name
                        }
                    });
                    this.suggestion("name");
                }
            }

            await store.executeIndex(new UsersIndex());
            await testContext.waitForIndexing(store);

            {
                const session = store.openSession();
                const suggestionQueryResult = await session.query(User, UsersIndex)
                    .suggestUsing(x => x.byField("name", "Jon"))
                    .execute();
                
                assert.strictEqual(suggestionQueryResult.name.suggestions.length, 1);
            }
        });

        it("can subscribe", async () => {
            // create a subscription
            const subscriptionName = await store.subscriptions.create({
                query: "from users where age >= 30"
            });

            // get subscription worker for your subscription
            const subscription = store.subscriptions.getSubscriptionWorker({ subscriptionName });

            subscription.on("error", err => {
                // handle errors
            });

            let done;
            const testDone = new Promise(resolve => done = resolve);
            subscription.on("batch", (batch, callback) => {
                try {
                    // do batch processing
                    print(batch.items);
                    assert.strictEqual(batch.items[0].id, "users/1-A");

                    // call the callback once you're done
                    // An acknowledgement will be sent to the server, so that server can send next batch
                    callback();
                } catch (err) {
                    // if processing fails for a particular batch
                    // pass the error to the callback
                    callback(err);
                }

                done();
            });

            await testDone;
        });
    });

    describe("using object literals for entities", function() {
        let docStore: IDocumentStore;
        
        beforeEach(async function () {
            docStore = new DocumentStore(store.urls, store.database);
        });

        afterEach(async () =>
            await disposeTestDocumentStore(docStore));

        it("document will be in the collection set in the conventions", async () => {
            docStore.conventions.findCollectionNameForObjectLiteral = () => "Books";
            docStore.initialize();
            {
                const session = docStore.openSession();
                await session.store({ name: "The Hobbit", author: "Tolkien", genre: "Fantasy" }, "books/1");
                await session.saveChanges();
            }
            {
                const session = docStore.openSession();
                const book = await session.load("books/1");
                assert.strictEqual(book["@metadata"]["@collection"], "Books");
            }
        });

        it("document will be in the collection specified by content", async () => {
            docStore.conventions.findCollectionNameForObjectLiteral = (e: any) => e.collection;
            docStore.initialize();

            const book = {
                collection: "Books", 
                name: "The Hobbit",
                author: "Tolkien",
                genre: "Fantasy"
            };
            
            {
                const session = docStore.openSession();
                await session.store(book, "books/1");
                await session.saveChanges();
            }
            {
                const session = docStore.openSession();
                const book = await session.load("books/1");
                
                const metadata = session.advanced.getMetadataFor(book);
                assert.strictEqual(metadata[CONSTANTS.Documents.Metadata.COLLECTION], "Books");
            }
        });

        it("document will be in empty collection when conventions not set", async () => {
            docStore.initialize();
            {
                const session = docStore.openSession();
                await session.store({ name: "The Hobbit", author: "Tolkien", genre: "Fantasy" }, "books/1");
                await session.saveChanges();
            }
            {
                const session = docStore.openSession();
                const book = await session.load("books/1");
                assert.strictEqual(book["@metadata"]["@collection"], undefined);
            }
        });

        it("can use advanced.patch", async () => {
            docStore.conventions.findCollectionNameForObjectLiteral = () => "users";
            docStore.initialize();
            
            {
                const session = docStore.openSession();
                await session.store({name: "Matilda", age: 17, underAge: true}, "users/1");
                await session.saveChanges();
            }
            {
                const session = docStore.openSession();
                session.advanced.increment("users/1", "age", 1);
                session.advanced.patch("users/1", "underAge", false);
                await session.saveChanges();
            }
            {
                const session = docStore.openSession();
                const loaded: any = await session.load("users/1");
                assert.strictEqual(loaded.underAge, false);
                assert.strictEqual(loaded.age, 18);
                assert.strictEqual(loaded.name, "Matilda");
            }
        });
    });

    describe("with revisions set up", function() {

        beforeEach(async () => testContext.setupRevisions(store, false, 5));

        it("can get revisions", async () => {

            const session = store.openSession();

            const user = {
                name: "Marcin",
                age: 30,
                pet: "Cat"
            };

            await session.store(user, "users/1");
            await session.saveChanges();

            user.name = "Roman";
            user.age = 40;
            await session.saveChanges();

            const revisions = await session.advanced.revisions.getFor("users/1");
            assert.strictEqual(revisions.length, 2);
        });
    });

    describe("can use time series", function () {
        
        it("basic", async () => {
            {
                const session = store.openSession();
                await session.store({ name: "John" }, "users/1");
                const tsf = session.timeSeriesFor("users/1", "heartbeat");
                tsf.append(new Date(), 120);
                await session.saveChanges();
            }
            {
                const session = store.openSession();
                const tsf = session.timeSeriesFor("users/1", "heartbeat");
                const heartbeats = await tsf.get();
                assert.strictEqual(heartbeats.length, 1);
            }
        })
    });

    async function prepareUserDataSet(store: IDocumentStore) {
        const users = [
            new User({
                name: "John",
                age: 30,
                registeredAt: new Date(2017, 10, 11),
                kids: ["Dmitri", "Mara"]
            }),
            new User({
                name: "Stefanie",
                age: 25,
                registeredAt: new Date(2015, 6, 30)
            }),
            new User({
                name: "Thomas",
                age: 25,
                registeredAt: new Date(2016, 3, 25)
            })
        ];

        const newSession = store.openSession();
        for (const u of users) {
            await newSession.store(u);
        }

        await newSession.saveChanges();
        return users;
    }
});
