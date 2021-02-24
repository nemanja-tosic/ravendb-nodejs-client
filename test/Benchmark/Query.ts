import Benchmark = require("benchmark");
import {RavenCommandResponsePipeline} from "../../src/Http/RavenCommandResponsePipeline";
import {DocumentConventions, QueryResult} from "../../src";
import { pipelineAsync, printStreamTraffic, stringToReadable } from "../../src/Utility/StreamUtil";
import { ObjectUtil } from "../../src/Utility/ObjectUtil";
import {Suite} from "benchmark";
import {TypeUtil} from "../../src/Utility/TypeUtil";
import {User} from "../Assets/Entities";
import * as Parser from "stream-json/Parser";
import * as stream from "stream";
import { StringUtil } from "../../src/Utility/StringUtil";
import * as Asm from "stream-json/Assembler";
import * as JSONStream from "JSONStream";


import { SaxParser } from "./Parsing";
import promisify = require("util.promisify");

describe.skip("parsing json", function() {


    it("can parse", async () => {
        const conventions = new DocumentConventions();

        const json = JSON.stringify({
            Results: [ sampleList ],
            IndexTimestamp: "0001-01-01T00:00:00.0000000",
            LastQueryTime: "0001-01-01T00:00:00.0000000",
            NodeTag: "A"
        });
        const bodyStream = stringToReadable(json);

        const rawResult = await RavenCommandResponsePipeline.create<QueryResult>()
            .parseJsonAsync()
            .jsonKeysTransform("DocumentQuery", conventions)
            .process(bodyStream);
    })

    it("test parsing", async () => {
        const json = JSON.stringify({
            Results: [ sampleList ],
            IndexTimestamp: "0001-01-01T00:00:00.0000000",
            LastQueryTime: "0001-01-01T00:00:00.0000000",
            NodeTag: "A"
        });

        const conventions = new DocumentConventions();

        const bodyStream: stream.Readable = stringToReadable(json);

        const parser = new Parser({ streamValues: false });

        stream.pipeline(bodyStream, parser);

        const streams = [bodyStream, parser];

        const result = await pipelineAsync(streams);

        const asmTask = new Promise<void>(resolve => {
            const asm = Asm.connectTo(parser);
            asm.on("done", asm => {
                console.log(asm.current);
                resolve();
            })
        });

        await asmTask;

        const rawResult = await RavenCommandResponsePipeline.create<QueryResult>()
            .parseJsonAsync()
            .jsonKeysTransform("DocumentQuery", conventions)
            .process(bodyStream);
    });

    it("can use streamjson", async () => {
        const json = JSON.stringify({
            Results: [ sampleList ],
            Includes: {
                "test1": {
                    "name": "first"
                },
                "test2" : {
                    "name": "second"
                }
            },
            IndexTimestamp: "0001-01-01T00:00:00.0000000",
            LastQueryTime: "0001-01-01T00:00:00.0000000",
            NodeTag: "A"
        });

        const bodyStream = stringToReadable(json);

        const output = bodyStream.pipe(JSONStream.parse([]));

        output.on("header", h => {
            console.log("header", h);
        })

        output.on("footer", f => {
            console.log("footer", f);
        });

        output.on("data", f => {
            console.log("data", f);
        });

        return new Promise(resolve => {
            output.on("end", resolve);
        });
    })

    it("transform object keys", async () => {
        const json = {
            Results: [ sampleList, sampleList, sampleList ],
            IndexTimestamp: "0001-01-01T00:00:00.0000000",
            LastQueryTime: "0001-01-01T00:00:00.0000000",
            NodeTag: "A"
        }

        const bigJson = {
            "test": [json, json, json],
            "test2": [json, json, json],
            "test4": [json, json, json],
            "test3": [json, json, json],
            "A": {
                "test": [json, json, json],
                "test2": [json, json, json],
                "test4": [json, json, json],
                "test3": [json, json, json]
            },
            "B": {
                "test": [json, json, json],
                "A": {
                    "test": [json, json, json],
                    "A": {
                        "test": [json, json, json],
                        "test2": [json, json, json],
                        "test4": [json, json, json],
                        "test3": [json, json, json]
                    },
                    "test2": [json, json, json],
                    "test4": [json, json, json],
                    "test3": [json, json, json]
                },
                "test2": [json, json, json],
                "test4": [json, json, json],
                "test3": [json, json, json]
            }
        }

        console.log(JSON.stringify(bigJson).length);
        const suite = new Benchmark.Suite("casing");

        suite.add("upper", () => {
            ObjectUtil.transformObjectKeys(bigJson, { defaultTransform: "upper" });
        })

        await configureAndRunSuite(suite);

    })

    it("parsing json", async () => {


        const conventions = new DocumentConventions();

        const json = JSON.stringify({
            Results: [ sampleList ],
            IndexTimestamp: "0001-01-01T00:00:00.0000000",
            LastQueryTime: "0001-01-01T00:00:00.0000000",
            NodeTag: "A"
        });

        const suite = new Benchmark.Suite("parsing");

        suite.add({
            name: "POC - sync parsing",
            fn: async (deferred) => {
                const object = JSON.parse(json);


            }
        })


        suite.add({
            name: "jsonstream",
            fn: async (deferred) => {
                const bodyStream = stringToReadable(json);

                const output = bodyStream.pipe(JSONStream.parse("results.*"));

                await pipelineAsync(output);

                deferred.resolve();
            }
        })

        suite.add({
            name: "manual async",
            defer: true,
            fn: (deferred) => {
                const bodyStream = stringToReadable(json);

                const parser = new Parser({ streamValues: false });

                bodyStream.pipe(parser);

                const asm = Asm.connectTo(parser);
                asm.on("done", asm => {
                    deferred.resolve();
                });
            }
        })

        suite.add({
            name: "sync",
            defer: true,
            fn: async (deferred) => {
                const bodyStream = stringToReadable(json);

                const rawResult = await RavenCommandResponsePipeline.create<QueryResult>()
                    .parseJsonSync()
                    .process(bodyStream);
                deferred.resolve();
            }
        });

        suite.add("JSON.parse", () => {
            JSON.parse(json);
        });

        suite.add({
            name: "async",
            defer: true,
            fn: async (deferred) => {
                const bodyStream = stringToReadable(json);

                const rawResult = await RavenCommandResponsePipeline.create<QueryResult>()
                    .parseJsonAsync()
                    .process(bodyStream);
                deferred.resolve();
            }
        });

        suite.add({
            name: "async with transform",
            defer: true,
            maxTime: 20,
            async: true,
            fn: async (deferred) => {
                const bodyStream = stringToReadable(json);

                const rawResult = await RavenCommandResponsePipeline.create<QueryResult>()
                    .parseJsonAsync()
                    .jsonKeysTransform("DocumentQuery", conventions)
                    .process(bodyStream);

                deferred.resolve();
            }
        });

        await configureAndRunSuite(suite);
    }).timeout(400_000);

    it("from literal - bench", async () => {

        const conventions = new DocumentConventions();
        const json = JSON.stringify({
            Results: [ sampleList, sampleList, sampleList],
            IndexTimestamp: "0001-01-01T00:00:00.0000000",
            LastQueryTime: "0001-01-01T00:00:00.0000000",
            NodeTag: "A"
        });

        const suite = new Benchmark.Suite("benchmark");
        const bodyStream = stringToReadable(json);
        const rawResult = await RavenCommandResponsePipeline.create<QueryResult>()
            .parseJsonAsync()
            .jsonKeysTransform("DocumentQuery", conventions)
            .process(bodyStream);

        suite.add("from literal - old version", () => {
            const queryResult = conventions.objectMapper
                .fromObjectLiteral<QueryResult>(rawResult, {
                    typeName: QueryResult.name,
                    nestedTypes: {
                        indexTimestamp: "date",
                        lastQueryTime: "date"
                    }
                }, new Map([[QueryResult.name, QueryResult]]));
        });

        suite.add("manual w/o dates - bottom line", () => {
            Object.assign(new QueryResult(), rawResult);
        });

        suite.add("manual with dates - current version", () => {
            const { indexTimestamp, lastQueryTime } = rawResult;

            const result = Object.assign(new QueryResult(), rawResult);
            result.indexTimestamp = conventions.dateUtil.parse(indexTimestamp as any as string);
            result.lastQueryTime = conventions.dateUtil.parse(lastQueryTime as any as string);
        });

        await configureAndRunSuite(suite);
    }).timeout(100_000);

    it("clone", async () => {
        const suite = new Benchmark.Suite("benchmark");

        suite.add("object utils clone - old one", () => {
            const clone = ObjectUtil.clone(sampleList);
        });

        suite.add("clone v2 - support for literals only - current one", () => {
            ObjectUtil.deepLiteralClone(sampleList);
        })

        await configureAndRunSuite(suite);
    });

    it("proto", () => {
        const a = {
            "test": 5
        };

        const b = new User();

        console.log((a as any).constructor.name);
        console.log((b as any).constructor.name);
    })
});

async function configureAndRunSuite(suite: Suite) {
    suite.on("cycle", function(event) {
        console.log(String(event.target));
    });

    suite.run({ async: true });

    await new Promise<void>(resolve => {
        suite.on("complete", function () {
            console.log("Fastest is " + this.filter("fastest").map("name"));
            resolve();
        })
    });
}

const sampleList = [
    {
        "_id": "60317948e1aca4093238a13b",
        "index": 0,
        "guid": "0b9de0ed-b940-4c0f-95ba-eadd94cfec51",
        "isActive": true,
        "balance": "$3,512.26",
        "picture": "http://placehold.it/32x32",
        "age": 25,
        "eyeColor": "green",
        "name": {
            "first": "Madge",
            "last": "Torres"
        },
        "company": "MINGA",
        "email": "madge.torres@minga.name",
        "phone": "+1 (930) 445-3487",
        "address": "386 Manor Court, Gilgo, Wisconsin, 4088",
        "about": "Veniam est consectetur occaecat aliquip occaecat esse in eu non officia. Nostrud consequat cillum officia occaecat officia deserunt laborum. Fugiat enim velit dolore veniam magna do aute. Adipisicing excepteur enim non ut cillum id minim quis. Dolor non qui nostrud et aliquip ex consequat culpa.",
        "registered": "Wednesday, September 18, 2019 1:20 PM",
        "latitude": "58.089485",
        "longitude": "132.330709",
        "tags": [
            "sint",
            "proident",
            "velit",
            "in",
            "magna"
        ],
        "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ],
        "friends": [
            {
                "id": 0,
                "name": "Wells Powell"
            },
            {
                "id": 1,
                "name": "Holman Conrad"
            },
            {
                "id": 2,
                "name": "Vargas Chapman"
            }
        ],
        "greeting": "Hello, Madge! You have 5 unread messages.",
        "favoriteFruit": "apple"
    },
    {
        "_id": "60317948788a06f5a6b0d123",
        "index": 1,
        "guid": "9098787d-38eb-4369-b4dd-c1a81562d652",
        "isActive": false,
        "balance": "$2,898.91",
        "picture": "http://placehold.it/32x32",
        "age": 22,
        "eyeColor": "brown",
        "name": {
            "first": "Barron",
            "last": "Hensley"
        },
        "company": "BIOSPAN",
        "email": "barron.hensley@biospan.biz",
        "phone": "+1 (822) 411-2378",
        "address": "979 Monroe Street, Neahkahnie, Louisiana, 6573",
        "about": "Esse esse eiusmod dolor exercitation amet eu duis est ad. Labore ullamco commodo do reprehenderit eu excepteur labore ullamco mollit eiusmod qui ipsum. Officia ea cupidatat commodo tempor ullamco velit nostrud duis laborum. Ea enim adipisicing sint velit ullamco dolor. Mollit exercitation incididunt Lorem laborum velit ea ullamco ullamco amet excepteur veniam.",
        "registered": "Sunday, September 4, 2016 10:11 PM",
        "latitude": "41.733786",
        "longitude": "164.695334",
        "tags": [
            "cupidatat",
            "quis",
            "dolor",
            "veniam",
            "eu"
        ],
        "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ],
        "friends": [
            {
                "id": 0,
                "name": "Herminia Winters"
            },
            {
                "id": 1,
                "name": "Della Hyde"
            },
            {
                "id": 2,
                "name": "Isabel Ortega"
            }
        ],
        "greeting": "Hello, Barron! You have 6 unread messages.",
        "favoriteFruit": "apple"
    },
    {
        "_id": "603179481fc586b95c13f2bf",
        "index": 2,
        "guid": "79807c4b-67eb-4d75-aabd-a4de94ba978b",
        "isActive": false,
        "balance": "$3,823.04",
        "picture": "http://placehold.it/32x32",
        "age": 27,
        "eyeColor": "green",
        "name": {
            "first": "Talley",
            "last": "Ross"
        },
        "company": "KOFFEE",
        "email": "talley.ross@koffee.net",
        "phone": "+1 (882) 516-2621",
        "address": "370 Debevoise Street, Byrnedale, Tennessee, 4011",
        "about": "Excepteur ex non in cupidatat. Non sit mollit veniam eu esse id nisi tempor velit nostrud cillum consectetur consectetur ea. Excepteur veniam velit fugiat dolore et veniam. Adipisicing ea exercitation excepteur nulla.",
        "registered": "Saturday, November 18, 2017 10:03 PM",
        "latitude": "-26.990179",
        "longitude": "-91.304518",
        "tags": [
            "proident",
            "laboris",
            "do",
            "excepteur",
            "id"
        ],
        "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ],
        "friends": [
            {
                "id": 0,
                "name": "Juanita Adams"
            },
            {
                "id": 1,
                "name": "Mejia Williams"
            },
            {
                "id": 2,
                "name": "Simon Fry"
            }
        ],
        "greeting": "Hello, Talley! You have 7 unread messages.",
        "favoriteFruit": "banana"
    },
    {
        "_id": "6031794899d021b94d10cf89",
        "index": 3,
        "guid": "8dcfe9e5-8a25-445b-9513-642be257005e",
        "isActive": true,
        "balance": "$3,406.96",
        "picture": "http://placehold.it/32x32",
        "age": 28,
        "eyeColor": "brown",
        "name": {
            "first": "Harrington",
            "last": "Mcknight"
        },
        "company": "MIRACULA",
        "email": "harrington.mcknight@miracula.us",
        "phone": "+1 (957) 472-2781",
        "address": "699 Blake Court, Richford, New Jersey, 4185",
        "about": "Esse nulla exercitation mollit ut laborum nostrud tempor nostrud reprehenderit amet. Labore reprehenderit officia aute exercitation magna. Excepteur minim laboris eiusmod sit sit laboris aliqua. Excepteur adipisicing ipsum ut pariatur anim magna. Sit ea elit est voluptate adipisicing fugiat eu reprehenderit deserunt amet ut ex ad. Magna cupidatat eu fugiat eiusmod elit aliquip magna. Eu pariatur cillum aliqua irure ullamco.",
        "registered": "Thursday, December 4, 2014 4:23 PM",
        "latitude": "-68.293509",
        "longitude": "-124.500286",
        "tags": [
            "sunt",
            "mollit",
            "ullamco",
            "minim",
            "Lorem"
        ],
        "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ],
        "friends": [
            {
                "id": 0,
                "name": "Santiago Montoya"
            },
            {
                "id": 1,
                "name": "Randolph Vargas"
            },
            {
                "id": 2,
                "name": "Lilia Mcdowell"
            }
        ],
        "greeting": "Hello, Harrington! You have 7 unread messages.",
        "favoriteFruit": "apple"
    },
    {
        "_id": "60317948a1d4bbed145ec8a7",
        "index": 4,
        "guid": "677926c6-5016-46f6-aa8b-70129cdddcdb",
        "isActive": false,
        "balance": "$3,717.59",
        "picture": "http://placehold.it/32x32",
        "age": 30,
        "eyeColor": "blue",
        "name": {
            "first": "Stephanie",
            "last": "Lancaster"
        },
        "company": "ENTHAZE",
        "email": "stephanie.lancaster@enthaze.com",
        "phone": "+1 (856) 579-3290",
        "address": "324 Wortman Avenue, Eureka, North Carolina, 985",
        "about": "Amet mollit velit anim amet cillum ut aliqua laboris Lorem dolore laborum magna proident anim. Sunt nisi proident esse dolore deserunt. Tempor mollit amet excepteur magna fugiat.",
        "registered": "Saturday, February 13, 2021 6:58 AM",
        "latitude": "87.19749",
        "longitude": "95.576086",
        "tags": [
            "in",
            "non",
            "officia",
            "irure",
            "et"
        ],
        "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ],
        "friends": [
            {
                "id": 0,
                "name": "Noel Porter"
            },
            {
                "id": 1,
                "name": "Vaughn Collins"
            },
            {
                "id": 2,
                "name": "Jana Walter"
            }
        ],
        "greeting": "Hello, Stephanie! You have 7 unread messages.",
        "favoriteFruit": "strawberry"
    },
    {
        "_id": "60317948554709bb0c68edd8",
        "index": 5,
        "guid": "44f1ccfc-e84a-4a2b-a5b5-ac59438f86fe",
        "isActive": true,
        "balance": "$1,674.61",
        "picture": "http://placehold.it/32x32",
        "age": 32,
        "eyeColor": "brown",
        "name": {
            "first": "Humphrey",
            "last": "House"
        },
        "company": "PARLEYNET",
        "email": "humphrey.house@parleynet.me",
        "phone": "+1 (913) 496-3818",
        "address": "111 Shale Street, Orovada, Alaska, 4159",
        "about": "Dolore nulla ad reprehenderit qui quis tempor labore esse Lorem pariatur sint quis. Nostrud aliquip occaecat velit duis aliqua esse consectetur esse et sit. Laborum laboris quis aliqua proident tempor consequat dolor sint incididunt. Voluptate elit proident aliqua cillum adipisicing cupidatat in et esse ad adipisicing Lorem nostrud. Ullamco consectetur excepteur consectetur nostrud officia nulla. Proident aliqua ipsum esse incididunt.",
        "registered": "Tuesday, October 24, 2017 6:47 PM",
        "latitude": "-75.926149",
        "longitude": "-38.689219",
        "tags": [
            "reprehenderit",
            "exercitation",
            "in",
            "laborum",
            "voluptate"
        ],
        "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ],
        "friends": [
            {
                "id": 0,
                "name": "Jarvis James"
            },
            {
                "id": 1,
                "name": "Angelita Whitaker"
            },
            {
                "id": 2,
                "name": "Sherri Chandler"
            }
        ],
        "greeting": "Hello, Humphrey! You have 8 unread messages.",
        "favoriteFruit": "apple"
    },
    {
        "_id": "60317948caf8d0ac3673e3f5",
        "index": 6,
        "guid": "4ab2cb9b-42c5-49a0-9b32-3d7edfbccebe",
        "isActive": true,
        "balance": "$3,785.36",
        "picture": "http://placehold.it/32x32",
        "age": 30,
        "eyeColor": "green",
        "name": {
            "first": "Horn",
            "last": "Hancock"
        },
        "company": "COMTOURS",
        "email": "horn.hancock@comtours.org",
        "phone": "+1 (883) 484-3641",
        "address": "272 Minna Street, Tilleda, Delaware, 9512",
        "about": "Qui cillum mollit minim ullamco enim. Esse dolor do eiusmod proident laboris excepteur qui elit quis enim do nostrud. Aute aliquip qui labore mollit sunt nulla. Adipisicing consequat in tempor culpa dolore velit qui. Anim nulla reprehenderit id nisi eiusmod exercitation exercitation dolor cupidatat duis voluptate.",
        "registered": "Monday, February 27, 2017 5:03 PM",
        "latitude": "-18.824346",
        "longitude": "-149.149142",
        "tags": [
            "sit",
            "et",
            "fugiat",
            "sunt",
            "dolore"
        ],
        "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ],
        "friends": [
            {
                "id": 0,
                "name": "Melisa Reynolds"
            },
            {
                "id": 1,
                "name": "Williams Lopez"
            },
            {
                "id": 2,
                "name": "Odom Mccarthy"
            }
        ],
        "greeting": "Hello, Horn! You have 10 unread messages.",
        "favoriteFruit": "apple"
    }
]

