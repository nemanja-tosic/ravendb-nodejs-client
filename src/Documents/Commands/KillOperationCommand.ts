import { RavenCommand } from "../../Http/RavenCommand.js";
import { ServerNode } from "../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../Primitives/Http.js";
import { throwError } from "../../Exceptions/index.js";

export class KillOperationCommand extends RavenCommand<void> {

    private readonly _id: number;

    public constructor(id: number)
    public constructor(id: number, nodeTag: string)
    public constructor(id: number, nodeTag?: string) {
        super();

        if (!id) {
            throwError("InvalidArgumentException", "Id cannot be null.");
        }
        this._id = id;

        if (nodeTag) {
            this._selectedNodeTag = nodeTag;
        }
    }

    public get isReadRequest(): boolean {
        return false;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = `${node.url}/databases/${node.database}/operations/kill?id=${this._id}`;
        return {
            uri,
            method: "POST"
        };
    }
}
