import { throwError } from "../../../Exceptions/index.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";
import { DatabaseAccess } from "./DatabaseAccess.js";
import { SecurityClearance } from "./SecurityClearance.js";
import { IServerOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { CertificateDefinition } from "./CertificateDefinition.js";

export class EditClientCertificateOperation implements IServerOperation<void> {
    private readonly _thumbprint: string;
    private readonly _permissions: Record<string, DatabaseAccess>;
    private readonly _name: string;
    private readonly _clearance: SecurityClearance;

    public constructor(parameters: EditClientCertificateParameters) {
        if (!parameters) {
            throwError("InvalidArgumentException", "Parameters cannot be null");
        }

        if (!parameters.name) {
            throwError("InvalidArgumentException", "Name cannot be null");
        }

        if (!parameters.thumbprint) {
            throwError("InvalidArgumentException", "Thumbprint cannot be null");
        }

        if (!parameters.permissions) {
            throwError("InvalidArgumentException", "Permissions cannot be null");
        }

        if (!parameters.clearance) {
            throwError("InvalidArgumentException", "Clearance cannot be null");
        }

        this._name = parameters.name;
        this._thumbprint = parameters.thumbprint;
        this._permissions = parameters.permissions;
        this._clearance = parameters.clearance;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new EditClientCertificateCommand(this._thumbprint, this._name, this._permissions, this._clearance);
    }
}

class EditClientCertificateCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _thumbprint: string;
    private readonly _permissions: Record<string, DatabaseAccess>;
    private readonly _name: string;
    private readonly _clearance: SecurityClearance;

    public constructor(thumbprint: string, name: string, permissions: Record<string, DatabaseAccess>, clearance: SecurityClearance) {
        super();

        this._thumbprint = thumbprint;
        this._name = name;
        this._permissions = permissions;
        this._clearance = clearance;
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/certificates/edit";

        const definition = {
            thumbprint: this._thumbprint,
            permissions: this._permissions,
            securityClearance: this._clearance,
            name: this._name
        } as CertificateDefinition;

        const body = this._serializer.serialize(definition);

        return {
            method: "POST",
            uri,
            headers: this._headers().typeAppJson().build(),
            body
        }
    }

    getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}

export interface EditClientCertificateParameters {
    thumbprint: string;
    permissions: Record<string, DatabaseAccess>;
    name: string;
    clearance: SecurityClearance;
}