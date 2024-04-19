import { Transform } from "node:stream";
import {
    ObjectUtil,
    ObjectChangeCaseOptions,
    ObjectChangeCaseOptionsBase, FieldNameConversion
} from "../../../Utility/ObjectUtil";
import { TypeUtil } from "../../../Utility/TypeUtil";

export interface ObjectKeyCaseTransformStreamOptionsBase extends ObjectChangeCaseOptionsBase {
    extractIgnorePaths?: ((entry: object) => (string | RegExp)[]);
    defaultTransform?: FieldNameConversion;
}

export interface ObjectKeyCaseTransformStreamOptions
    extends ObjectChangeCaseOptions {
    handleKeyValue?: boolean;
    extractIgnorePaths?: ((entry: object) => (string | RegExp)[]);
}

const DEFAULT_OBJECT_KEY_CASE_TRANSFORM_OPTS = {
    arrayRecursive: true,
    recursive: true
};

export class ObjectKeyCaseTransformStream extends Transform {

    private _ignorePaths: (string | RegExp)[];
    private readonly _getIgnorePaths: (entry: object) => (string | RegExp)[] = () => this._ignorePaths;

    private readonly _handleKeyValue: boolean;

    constructor(private _opts: ObjectKeyCaseTransformStreamOptions) {
        super({ objectMode: true });

        this._opts = Object.assign({}, DEFAULT_OBJECT_KEY_CASE_TRANSFORM_OPTS, this._opts);

        if (typeof _opts.extractIgnorePaths === "function") {
            this._getIgnorePaths = _opts.extractIgnorePaths;
        }

        this._handleKeyValue = _opts.handleKeyValue;
    }

    public _transform(chunk: any, enc: string, callback) {
        let entry = this._handleKeyValue ? chunk["value"] : chunk;
        const key = chunk["key"];
        if (TypeUtil.isPrimitive(entry) || TypeUtil.isNullOrUndefined(entry)) {
            return callback(null, chunk);
        }

        const ignorePaths = this._getIgnorePaths(entry);
        const opts = Object.assign({}, this._opts);
        opts.ignorePaths = [...new Set((opts.ignorePaths || [])
            .concat(ignorePaths || []))];

        entry = ObjectUtil.transformObjectKeys(entry, opts);
        const data = this._handleKeyValue
            ? { key, value: entry }
            : entry;
        callback(null, data);
    }
}
