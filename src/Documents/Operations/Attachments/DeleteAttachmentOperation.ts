import { IOperation, OperationResultType } from "../OperationAbstractions.js";
import { HttpCache } from "../../../Http/HttpCache.js";
import { StringUtil } from "../../../Utility/StringUtil.js";
import { throwError } from "../../../Exceptions/index.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { IDocumentStore } from "../../IDocumentStore.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";

export class DeleteAttachmentOperation implements IOperation<void> {
    private readonly _documentId: string;
    private readonly _name: string;
    private readonly _changeVector: string;

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public constructor(documentId: string, name: string, changeVector?: string) {
        this._documentId = documentId;
        this._name = name;
        this._changeVector = changeVector;
    }

    public getCommand(
        store: IDocumentStore, conventions: DocumentConventions, httpCache: HttpCache): RavenCommand<void> {
        return new DeleteAttachmentCommand(this._documentId, this._name, this._changeVector);
    }
}

export class DeleteAttachmentCommand extends RavenCommand<void> {
    private readonly _documentId: string;
    private readonly _name: string;
    private readonly _changeVector: string;

    public constructor(documentId: string, name: string, changeVector: string) {
        super();
        if (StringUtil.isNullOrWhitespace(documentId)) {
            throwError("InvalidArgumentException", "DocumentId cannot be null or empty");
        }
        if (StringUtil.isNullOrWhitespace(name)) {
            throwError("InvalidArgumentException", "Name cannot be null or empty");
        }

        this._documentId = documentId;
        this._name = name;
        this._changeVector = changeVector;
    }

    public get isReadRequest() {
        return false;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database
            + "/attachments?id=" + encodeURIComponent(this._documentId)
            + "&name=" + encodeURIComponent(this._name);
        const req = {
            uri,
            method: "DELETE"
        };

        this._addChangeVectorIfNotNull(this._changeVector, req);

        return req;
    }
}
