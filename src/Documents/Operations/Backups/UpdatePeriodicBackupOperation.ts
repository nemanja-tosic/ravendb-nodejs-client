import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions";
import { UpdatePeriodicBackupOperationResult } from "./UpdatePeriodicBackupOperationResult";
import { PeriodicBackupConfiguration } from "./PeriodicBackupConfiguration";
import { HttpRequestParameters } from "../../../Primitives/Http";
import { Stream } from "node:stream";
import { DocumentConventions } from "../../Conventions/DocumentConventions";
import { RavenCommand } from "../../../Http/RavenCommand";
import { ServerNode } from "../../../Http/ServerNode";
import { IRaftCommand } from "../../../Http/IRaftCommand";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator";

export class UpdatePeriodicBackupOperation implements IMaintenanceOperation<UpdatePeriodicBackupOperationResult> {
    private readonly _configuration: PeriodicBackupConfiguration;

    public constructor(configuration: PeriodicBackupConfiguration) {
        this._configuration = configuration;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<UpdatePeriodicBackupOperationResult> {
        return new UpdatePeriodicBackupCommand(this._configuration);
    }
}

class UpdatePeriodicBackupCommand extends RavenCommand<UpdatePeriodicBackupOperationResult> implements IRaftCommand {
    private readonly _configuration: PeriodicBackupConfiguration;

    public constructor(configuration: PeriodicBackupConfiguration) {
        super();

        this._configuration = configuration;
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/periodic-backup";

        const body = this._serializer.serialize(this._configuration);

        return {
            uri,
            method: "POST",
            headers: this._headers().typeAppJson().build(),
            body
        }
    }

    async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        return this._parseResponseDefaultAsync(bodyStream);
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}
