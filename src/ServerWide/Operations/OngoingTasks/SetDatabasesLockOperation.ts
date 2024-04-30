import { IServerOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { throwError } from "../../../Exceptions/index.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { TypeUtil } from "../../../Utility/TypeUtil.js";
import { DatabaseLockMode } from "../../index.js";

export class SetDatabasesLockOperation implements IServerOperation<void> {

    private readonly _parameters: SetDatabasesLockParameters;

    public constructor(databaseName: string, mode: DatabaseLockMode)
    public constructor(parameters: SetDatabasesLockParameters)
    public constructor(databaseNameOrParameters: string | SetDatabasesLockParameters, mode?: DatabaseLockMode) {
        if (!databaseNameOrParameters) {
            throwError("InvalidArgumentException", "Database or Parameters cannot be null");
        }

        if (TypeUtil.isString(databaseNameOrParameters)) {
            this._parameters = {
                databaseNames: [ databaseNameOrParameters ],
                mode
            }
        } else {
            if (!databaseNameOrParameters.databaseNames || databaseNameOrParameters.databaseNames.length === 0) {
                throwError("InvalidArgumentException", "DatabaseNames cannot be null or empty");
            }
            this._parameters = databaseNameOrParameters;
        }
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new SetDatabasesLockCommand(conventions, this._parameters);
    }
}

class SetDatabasesLockCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _parameters: object;

    constructor(conventions: DocumentConventions, parameters: SetDatabasesLockParameters) {
        super();

        if (!conventions) {
            throwError("InvalidArgumentException", "Conventions cannot be null");
        }

        if (!parameters) {
            throwError("InvalidArgumentException", "Parameters cannot be null");
        }

        this._parameters = conventions.objectMapper.toObjectLiteral(parameters);
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/databases/set-lock";
        const body = this._serializer.serialize(this._parameters);
        const headers = this._headers()
            .typeAppJson().build();

        return {
            uri,
            method: "POST",
            body,
            headers
        }
    }

    get isReadRequest(): boolean {
        return false;
    }

    getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}

export interface SetDatabasesLockParameters {
    databaseNames: string[];
    mode: DatabaseLockMode;
}