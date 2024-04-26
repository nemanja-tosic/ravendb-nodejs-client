import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { IndexDefinition } from "../../Indexes/IndexDefinition.js";
import { throwError } from "../../../Exceptions/index.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { HeadersBuilder } from "../../../Utility/HttpUtil.js";
import { Stream } from "node:stream";

export class IndexHasChangedOperation implements IMaintenanceOperation<boolean> {

    private readonly _definition: IndexDefinition;

    public constructor(definition: IndexDefinition) {
        if (!definition) {
            throwError("InvalidArgumentException", "IndexDefinition cannot be null");
        }

        this._definition = definition;
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<boolean> {
        return new IndexHasChangedCommand(conventions, this._definition);
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }
}

export class IndexHasChangedCommand extends RavenCommand<boolean> {

    private readonly _definition: object;

    public constructor(conventions: DocumentConventions, definition: IndexDefinition) {
        super();

        this._definition = conventions.objectMapper.toObjectLiteral(definition);
    }

    public get isReadRequest(): boolean {
        return false;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/indexes/has-changed";

        const body = this._serializer.serialize(this._definition);

        const headers = HeadersBuilder.create()
            .typeAppJson().build();
        return {
            method: "POST",
            uri,
            body,
            headers
        };
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        let body: string = null;
        const results = await this._defaultPipeline(_ => body = _)
            .process(bodyStream);
        this.result = results["changed"];
        return body;
    }
}
