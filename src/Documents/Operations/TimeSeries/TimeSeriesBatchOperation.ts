import { IOperation, OperationResultType } from "../OperationAbstractions.js";
import { TimeSeriesOperation } from "./TimeSeriesOperation.js";
import { throwError } from "../../../Exceptions/index.js";
import { IDocumentStore } from "../../IDocumentStore.js";
import { HttpCache } from "../../../Http/HttpCache.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";

export class TimeSeriesBatchOperation implements IOperation<void> {
    private readonly _documentId: string;
    private readonly _operation: TimeSeriesOperation;

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public constructor(documentId: string, operation: TimeSeriesOperation) {
        if (!documentId) {
            throwError("InvalidArgumentException", "Document id cannot be null");
        }

        if (!operation) {
            throwError("InvalidArgumentException", "Operation cannot be null");
        }

        this._documentId = documentId;
        this._operation = operation;
    }

    getCommand(store: IDocumentStore, conventions: DocumentConventions, httpCache: HttpCache): RavenCommand<void> {
        return new TimeSeriesBatchCommand(this._documentId, this._operation, conventions);
    }
}

class TimeSeriesBatchCommand extends RavenCommand<void> {
    private readonly _documentId: string;
    private readonly _operation: TimeSeriesOperation;
    private readonly _conventions: DocumentConventions;

    public constructor(documentId: string, operation: TimeSeriesOperation, conventions: DocumentConventions) {
        super();

        this._documentId = documentId;
        this._operation = operation;
        this._conventions = conventions;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/timeseries?docId=" + this._urlEncode(this._documentId);

        const payload = this._operation.serialize(this._conventions);
        const body = this._serializer.serialize(payload);

        return {
            method: "POST",
            uri,
            body,
            headers: this._headers().typeAppJson().build()
        }
    }

    get isReadRequest(): boolean {
        return false;
    }
}