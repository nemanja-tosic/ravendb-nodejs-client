import * as assert from "node:assert";

// eslint-disable-next-line @typescript-eslint/ban-types
export async function assertThrows(func: Function, errAssert?: (err: Error) => void) {
    try {
        await func();
        assert.fail(`Function '${func.name || func.toString()}' should have thrown.`);
    } catch (err) {
        if (errAssert) {
            errAssert(err);
        }

        return err;
    }
}

export function assertThat(value: Promise<any>): never; // prevent assertions on promises
export function assertThat(value: any): JavaAssertionBuilder;
export function assertThat(value: any) {
    return new JavaAssertionBuilder(value);
}

export class JavaAssertionBuilder {
    constructor(private _value) {}

    public isNull() {
        assert.ok(!this._value);
        return this;
    }

    public isEqualTo(val) {
        assert.strictEqual(this._value, val);
        return this;
    }

    public isCloseTo(val: number, offset: number) {
        assert.ok(Math.abs(val - this._value) <= offset, `Value ${this._value} should be close to: ${val} (max offset = ${offset})`);
    }

    public isNotEqualTo(val) {
        assert.notStrictEqual(this._value, val);
        return this;
    }

    public isZero() {
        assert.strictEqual(this._value, 0);
        return this;
    }

    public contains(val) {
        assert.ok(this._value.includes(val), `'${this._value}' does not contain '${val}.'`);
        return this;
    }

    public startsWith(val) {
        assert.ok(this._value.indexOf(val) === 0, `'${this._value}' does not start with '${val}.'`);
        return this;
    }

    public endsWith(val) {
        assert.ok(this._value.indexOf(val) === this._value.length - val.length, `'${this._value}' does not end with '${val}.'`);
        return this;
    }

    public isTrue() {
        assert.strictEqual(this._value, true);
        return this;
    }

    public isFalse() {
        assert.strictEqual(this._value, false);
        return this;
    }

    public isSameAs(val) {
        assert.strictEqual(this._value, val);
    }

    public isNotSameAs(val) {
        assert.notStrictEqual(this._value, val);
    }

    public isNotNull() {
        assert.ok(this._value);
        return this;
    }

    public isNotEmpty() {
        assert.ok(this._value.length > 0, "Cannot be empty.");
        return this;
    }

    public hasSize(n) {
        if (this._value instanceof Map) {
            assert.strictEqual(this._value.size, n);
        } else {
            assert.strictEqual(Object.keys(this._value).length, n);
        }

        return this;
    }

    public containsKey(k) {
        if (this._value instanceof Map) {
            assert.ok(this._value.has(k));
        } else {
            assert.ok(k in this._value);
        }

        return this;
    }

    public containsEntry(k, v) {
        if (this._value instanceof Map) {
            assert.ok(this._value.has(k));
            assert.strictEqual(this._value.get(k), v);
        } else {
            assert.ok(k in this._value);
            assert.strictEqual(this._value[k], v);
        }

        return this;
    }

    public isGreaterThan(v) {
        assert.ok(this._value > v, `${this._value} is not greater than ${v}.`);
        return this;
    }

    public isLessThan(v) {
        assert.ok(this._value < v, `${this._value} is not less than ${v}.`);
        return this;
    }

    public allMatch(matcher: (v: any) => boolean) {
        for (const v of this._value) {
            assert.ok(matcher(v));
        }
    }

    public anyMatch(matcher: (v: any) => boolean) {
        let hasMatch = false;
        for (const v of this._value) {
            if (matcher(v)) {
                hasMatch = true;
            }
        }

        assert.ok(hasMatch);
    }

    public anySatisfy(matcher: (v: any) => void) {
        let satisfy = false;
        for (const v of this._value) {
            try {
                matcher(v);
                satisfy = true;
            } catch {
                // ignore
            }
        }

        assert.ok(satisfy, "None of items satisfy condition");
        return this;
    }
}
