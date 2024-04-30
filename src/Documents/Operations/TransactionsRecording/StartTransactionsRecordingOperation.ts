import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { throwError } from "../../../Exceptions/index.js";

export class StartTransactionsRecordingOperation implements IMaintenanceOperation<void> {
    private readonly _filePath: string;

    public constructor(filePath: string) {
        if (!filePath) {
            throwError("InvalidArgumentException", "FilePath cannot be null");
        }
        this._filePath = filePath;
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new StartTransactionsRecordingCommand(this._filePath);
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }
}

class StartTransactionsRecordingCommand extends RavenCommand<void> {
    private readonly _filePath: string;

    public constructor(filePath: string) {
        super();

        this._filePath = filePath;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/transactions/start-recording";

        const body = this._serializer.serialize({
            File: this._filePath
        });

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

    async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        return this._parseResponseDefaultAsync(bodyStream);
    }
}