import { QueryToken } from "./QueryToken.js";
import { throwError } from "../../../Exceptions/index.js";
import { StringUtil } from "../../../Utility/StringUtil.js";

export class FromToken extends QueryToken {

    private readonly _collectionName: string;
    private readonly _indexName: string;
    private readonly _dynamic: boolean;
    private readonly _alias: string;

    public get collection(): string {
        return this._collectionName;
    }

    public get indexName(): string {
        return this._indexName;
    }

    public get isDynamic() {
        return this._dynamic;
    }

    public alias(): string {
        return this._alias;
    }

    private constructor(indexName: string, collectionName: string);
    private constructor(indexName: string, collectionName: string, alias: string);
    private constructor(indexName: string, collectionName: string, alias: string = null) {
        super();

        this._collectionName = collectionName;
        this._indexName = indexName;
        this._dynamic = !!collectionName;
        this._alias = alias;
    }

    public static create(indexName: string, collectionName: string, alias: string): FromToken {
        return new FromToken(indexName, collectionName, alias);
    }

    private static WHITE_SPACE_CHARS: string[] = [" ", "\t", "\r", "\n"];

    public writeTo(writer): void {
        if (!this._indexName && !this._collectionName) {
            throwError("InvalidOperationException", "Either indexName or collectionName must be specified");
        }

        if (this._dynamic) {
            writer.append("from '");
            StringUtil.escapeString(writer, this._collectionName);
            writer.append("'");
        } else {
            writer
                .append("from index '")
                .append(this._indexName)
                .append("'");
        }

        if (this._alias) {
            writer.append(" as ").append(this._alias);
        }
    }
}
