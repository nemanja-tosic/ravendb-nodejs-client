import { CertificateRawData } from "./CertificateRawData.js";
import { DatabaseAccess } from "./DatabaseAccess.js";
import { SecurityClearance } from "./SecurityClearance.js";
import { throwError } from "../../../Exceptions/index.js";
import { HttpRequestParameters, HttpResponse } from "../../../Primitives/Http.js";
import { getHeaders } from "../../../Utility/HttpUtil.js";
import { Stream } from "node:stream";
import { readToBuffer } from "../../../Utility/StreamUtil.js";
import { IServerOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";

export class CreateClientCertificateOperation implements IServerOperation<CertificateRawData> {
    private readonly _name: string;
    private readonly _permissions: Record<string, DatabaseAccess>;
    private readonly _clearance: SecurityClearance;
    private readonly _password: string;

    public constructor(name: string, permissions: Record<string, DatabaseAccess>, clearance: SecurityClearance, password?: string) {
        if (!name) {
            throwError("InvalidArgumentException", "Name cannot be null.");
        }
        if (!permissions) {
            throwError("InvalidArgumentException", "Permissions cannot be null.");
        }

        this._name = name;
        this._permissions = permissions;
        this._clearance = clearance;
        this._password = password;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<CertificateRawData> {
        return new CreateClientCertificateCommand(this._name, this._permissions, this._clearance, this._password);
    }
}

class CreateClientCertificateCommand extends RavenCommand<CertificateRawData> implements IRaftCommand {
    private readonly _name: string;
    private readonly _permissions: Record<string, DatabaseAccess>;
    private readonly _clearance: SecurityClearance;
    private readonly _password: string;

    public constructor(name: string, permissions: Record<string, DatabaseAccess>, clearance: SecurityClearance, password?: string) {
        super();

        if (!name) {
            throwError("InvalidArgumentException", "Name cannot be null.");
        }

        if (!permissions) {
            throwError("InvalidArgumentException", "Permissions cannot be null.");
        }

        this._name = name;
        this._permissions = permissions;
        this._clearance = clearance;
        this._password = password;

        this._responseType = "Raw";
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/certificates";

        const body = this._serializer
            .serialize({
                Name: this._name,
                SecurityClearance: this._clearance,
                Password: this._password || undefined,
                Permissions: this._permissions,

            });

        return {
            method: "POST",
            uri,
            headers: getHeaders()
                .typeAppJson()
                .build(),
            body
        }
    }

    setResponseRaw(response: HttpResponse, body: string) {
        super.setResponseRaw(response, body);
    }

    async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        this.result = {
            rawData: await readToBuffer(bodyStream)
        };

        return null;
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}