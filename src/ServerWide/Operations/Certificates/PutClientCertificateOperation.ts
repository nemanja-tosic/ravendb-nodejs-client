import { DatabaseAccess } from "./DatabaseAccess.js";
import { SecurityClearance } from "./SecurityClearance.js";
import { throwError } from "../../../Exceptions/index.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { getHeaders } from "../../../Utility/HttpUtil.js";
import { IServerOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";

export class PutClientCertificateOperation implements IServerOperation<void> {
    private readonly _certificate: string;
    private readonly _permissions: Record<string, DatabaseAccess>;
    private readonly _name: string;
    private readonly _clearance: SecurityClearance;
    private readonly _twoFactorAuthenticationKey: string;

    public constructor(name: string, certificate: string, permissions: Record<string, DatabaseAccess>, clearance: SecurityClearance, twoFactorAuthenticationKey?: string) {
        if (!certificate) {
            throwError("InvalidArgumentException", "Certificate cannot be null");
        }

        if (!permissions) {
            throwError("InvalidArgumentException", "Permissions cannot be null.");
        }

        if (!name) {
            throwError("InvalidArgumentException", "Name cannot be null");
        }

        this._certificate = certificate;
        this._permissions = permissions;
        this._name = name;
        this._clearance = clearance;
        this._twoFactorAuthenticationKey = twoFactorAuthenticationKey;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new PutClientCertificateCommand(this._name, this._certificate, this._permissions, this._clearance, this._twoFactorAuthenticationKey);
    }
}

class PutClientCertificateCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _certificate: string;
    private readonly _permissions: Record<string, DatabaseAccess>;
    private readonly _name: string;
    private readonly _clearance: SecurityClearance;
    private readonly _twoFactorAuthenticationKey: string;

    public constructor(name: string,
                       certificate: string,
                       permissions: Record<string, DatabaseAccess>,
                       clearance: SecurityClearance,
                       twoFactorAuthenticationKey: string) {
        super();

        if (!certificate) {
            throwError("InvalidArgumentException", "Certificate cannot be null");
        }

        if (!permissions) {
            throwError("InvalidArgumentException", "Permissions cannot be null.");
        }

        this._certificate = certificate;
        this._permissions = permissions;
        this._name = name;
        this._clearance = clearance;
        this._twoFactorAuthenticationKey = twoFactorAuthenticationKey;
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/certificates";

        const body = this._serializer
            .serialize({
                Name: this._name,
                Certificate: this._certificate,
                SecurityClearance: this._clearance,
                Permissions: this._permissions,
                TwoFactorAuthenticationKey: this._twoFactorAuthenticationKey ?? undefined
            });

        return {
            uri,
            method: "PUT",
            headers: getHeaders()
                .typeAppJson()
                .build(),
            body
        }
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}
