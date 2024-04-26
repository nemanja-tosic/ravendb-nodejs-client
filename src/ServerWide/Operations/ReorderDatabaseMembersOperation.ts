import { throwError } from "../../Exceptions/index.js";
import { HttpRequestParameters } from "../../Primitives/Http.js";
import { IServerOperation, OperationResultType } from "../../Documents/Operations/OperationAbstractions.js";
import { DocumentConventions } from "../../Documents/Conventions/DocumentConventions.js";
import { RavenCommand } from "../../Http/RavenCommand.js";
import { ServerNode } from "../../Http/ServerNode.js";
import { IRaftCommand } from "../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../Utility/RaftIdGenerator.js";

export class ReorderDatabaseMembersOperation implements IServerOperation<void> {
    private readonly _database: string;
    private readonly _parameters: ReorderDatabaseMembersParameters;

    public constructor(database: string, order: string[], fixed: boolean = false) {
        if (!order || order.length === 0) {
            throwError("InvalidArgumentException", "Order list must contain values");
        }

        this._database = database;
        this._parameters = {
            membersOrder: order,
            fixed
        }
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new ReorderDatabaseMembersCommand(this._database, this._parameters);
    }
}

class ReorderDatabaseMembersCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _databaseName: string;
    private readonly _parameters: ReorderDatabaseMembersParameters;

    public constructor(databaseName: string, parameters: ReorderDatabaseMembersParameters) {
        super();

        if (!databaseName) {
            throwError("InvalidArgumentException", "Database cannot be empty");
        }

        this._databaseName = databaseName;
        this._parameters = parameters;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/databases/reorder?name=" + this._databaseName;

        const body = this._serializer.serialize(this._parameters);

        return {
            uri,
            method: "POST",
            headers: this._headers().typeAppJson().build(),
            body
        }
    }

    get isReadRequest(): boolean {
        return false;
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}

export interface ReorderDatabaseMembersParameters {
    membersOrder: string[];
    fixed: boolean;
}
