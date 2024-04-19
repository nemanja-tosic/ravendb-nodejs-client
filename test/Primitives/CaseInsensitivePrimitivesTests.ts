import assert from "node:assert"

import { CaseInsensitiveKeysMap } from "../../src/Primitives/CaseInsensitiveKeysMap";
import { CaseInsensitiveStringSet } from "../../src/Primitives/CaseInsensitiveStringSet";

describe("CaseInsensitiveKeyMap", function () {

    let map: Map<string, any>;
    
    beforeEach(() => {
        map = CaseInsensitiveKeysMap.create<number>(); 
    });

    it("set, has and get with case insensitive keys", async () => {
        map.set("TEsT_KEY", 1);
        assert.strictEqual(map.get("test_keY"), 1);
        assert.ok(map.has("TeSt_kEy"));
        
        // gives actual set entries
        const entries = Array.from(map.entries());
        assert.strictEqual(entries[0][0], "TEsT_KEY");

        const iterable = [...map];
        assert.strictEqual(iterable[0][0], "TEsT_KEY");
        assert.strictEqual(iterable[0][1], 1);

        assert.ok(map.delete("teST_KEY"));
        assert.ok(!map.has("TeSt_kEy"));
    });
});

describe("CaseInsensitiveStringSet", function () {

    let set: Set<string>;
    
    beforeEach(() => {
        set = CaseInsensitiveStringSet.create(); 
    });

    it("set, has and get with case insensitive strings", async () => {
        set.add("TEsT_KEY");
        assert.ok(set.has("TeSt_kEy"));
        assert.strictEqual(Array.from(set)[0], "TEsT_KEY");
        assert.strictEqual(Array.from(set.entries())[0][0], "TEsT_KEY");
        
        assert.ok(set.delete("teST_KEY"));
        assert.ok(!set.has("TeSt_kEy"));
    });
});
