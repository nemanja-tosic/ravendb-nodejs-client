import { throwError } from "../../../Exceptions/index.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { IServerOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";

export class ReplaceClusterCertificateOperation implements IServerOperation<void> {
    private readonly _certBytes: Buffer;
    private readonly _replaceImmediately: boolean;

    public constructor(certBytes: Buffer, replaceImmediately: boolean) {
        if (!certBytes) {
            throwError("InvalidArgumentException", "CertBytes cannot be null");
        }

        this._certBytes = certBytes;
        this._replaceImmediately = replaceImmediately;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new ReplaceClusterCertificateCommand(this._certBytes, this._replaceImmediately);
    }
}

class ReplaceClusterCertificateCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _certBytes: Buffer;
    private readonly _replaceImmediately: boolean;

    public constructor(certBytes: Buffer, replaceImmediately: boolean) {
        super();
        if (!certBytes) {
            throwError("InvalidArgumentException", "CertBytes cannot be null");
        }

        this._certBytes = certBytes;
        this._replaceImmediately = replaceImmediately;
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/certificates/replace-cluster-cert?replaceImmediately=" + (this._replaceImmediately ? "true" : "false");

        const body = this._serializer.serialize({
            Certificate: this._certBytes.toString("base64")
        });

        return {
            uri,
            method: "POST",
            headers: this._headers().typeAppJson().build(),
            body
        }
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}
