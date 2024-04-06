import { IOperation, OperationResultType } from "../OperationAbstractions";
import { CountersDetail } from "./CountersDetail";
import { CounterBatch } from "./CounterBatch";
import { DocumentConventions } from "../../Conventions/DocumentConventions";
import { IDocumentStore } from "../../IDocumentStore";
import { HttpCache } from "../../../Http/HttpCache";
import { RavenCommand } from "../../../Http/RavenCommand";
import { throwError } from "../../../Exceptions";
import { ServerNode } from "../../../Http/ServerNode";
import { HttpRequestParameters } from "../../../Primitives/Http";
import { Stream } from "node:stream";

export class CounterBatchOperation implements IOperation<CountersDetail> {

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    private readonly _counterBatch: CounterBatch;

    public constructor(counterBatch: CounterBatch) {
        this._counterBatch = counterBatch;
    }

    public getCommand(
        store: IDocumentStore, conventions: DocumentConventions, cache: HttpCache): RavenCommand<CountersDetail> {
        return new CounterBatchCommand(this._counterBatch);
    }
}

export class CounterBatchCommand extends RavenCommand<CountersDetail> {
    private readonly _counterBatch: CounterBatch;

    public constructor(counterBatch: CounterBatch) {
        super();
        if (!counterBatch) {
            throwError("InvalidArgumentException", "CounterBatch cannot be null.");
        }

        this._counterBatch = counterBatch;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
    const uri = node.url + "/databases/" + node.database + "/counters";
    const body = JSON.stringify(this._counterBatch.serialize());
    return {
        method: "POST",
        uri,
        body,
        headers: this._headers().typeAppJson().build()
    };
}
    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            return;
        }

        return await this._parseResponseDefaultAsync(bodyStream);
    }

    public get isReadRequest(): boolean {
        return false;
    }
}
