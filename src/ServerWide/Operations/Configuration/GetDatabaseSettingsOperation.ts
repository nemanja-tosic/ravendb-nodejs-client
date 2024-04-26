import { IMaintenanceOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { DatabaseSettings } from "./DatabaseSettings.js";
import { throwError } from "../../../Exceptions/index.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { Stream } from "node:stream";

export class GetDatabaseSettingsOperation implements IMaintenanceOperation<DatabaseSettings> {

    private readonly _databaseName: string;

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public constructor(databaseName: string) {
        if (!databaseName) {
            throwError("InvalidArgumentException", "DatabaseName cannot be null");
        }
        this._databaseName = databaseName;
    }

    getCommand(conventions: DocumentConventions): RavenCommand<DatabaseSettings> {
        return new GetDatabaseSettingsCommand(this._databaseName);
    }
}


class GetDatabaseSettingsCommand extends RavenCommand<DatabaseSettings> {
    private readonly _databaseName: string;

    public constructor(databaseName: string) {
        super();
        if (!databaseName) {
            throwError("InvalidArgumentException", "DatabaseName cannot be null");
        }

        this._databaseName = databaseName;
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + this._databaseName + "/admin/record";

        return {
            method: "GET",
            uri
        }
    }

    async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        let body;

        const result = await this._pipeline<any>()
            .parseJsonSync()
            .collectBody(_ => body = _)
            .process(bodyStream);

        this.result = {
            settings: result.Settings
        }
        return body;
    }
}
