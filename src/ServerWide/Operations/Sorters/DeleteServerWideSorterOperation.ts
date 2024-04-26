import { IServerOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { throwError } from "../../../Exceptions/index.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";

export class DeleteServerWideSorterOperation implements IServerOperation<void> {

    private readonly _sorterName: string;

    public constructor(sorterName: string) {
        if (!sorterName) {
            throwError("InvalidArgumentException", "SorterName cannot be null");
        }

        this._sorterName = sorterName;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new DeleteServerWideSorterCommand(this._sorterName);
    }
}

class DeleteServerWideSorterCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _sorterName: string;

    public constructor(sorterName: string) {
        super();

        if (!sorterName) {
            throwError("InvalidArgumentException", "SorterName cannot be null");
        }

        this._sorterName = sorterName;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/sorters?name=" + this._urlEncode(this._sorterName);

        return {
            uri,
            method: "DELETE"
        }
    }

    get isReadRequest(): boolean {
        return false;
    }

    getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}