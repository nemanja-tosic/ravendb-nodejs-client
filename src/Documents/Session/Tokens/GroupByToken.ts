import { QueryToken } from "./QueryToken.js";
import { GroupByMethod } from "../../Queries/GroupByMethod.js";

export class GroupByToken extends QueryToken {

    private readonly _fieldName: string;
    private readonly _method: GroupByMethod;

    private constructor(fieldName: string, method: GroupByMethod) {
        super();
        this._fieldName = fieldName;
        this._method = method;
    }

    public static create(fieldName: string): GroupByToken;
    public static create(fieldName: string, method: GroupByMethod): GroupByToken;
    public static create(fieldName: string, method: GroupByMethod = "None"): GroupByToken {
        return new GroupByToken(fieldName, method);
    }

    public writeTo(writer): void {
        if (this._method !== "None") {
            writer.append("Array(");
        }
        QueryToken.writeField(writer, this._fieldName);
        if (this._method !== "None") {
            writer.append(")");
        }
    }
}
