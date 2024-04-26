import { IMaintenanceOperation, OperationResultType } from "../../../Documents/Operations/OperationAbstractions.js";
import { throwError } from "../../../Exceptions/index.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";

export class PutDatabaseSettingsOperation implements IMaintenanceOperation<void> {
    private readonly _databaseName: string;
    private readonly _configurationSettings: Record<string, string>;

    public constructor(databaseName: string, configurationSettings: Record<string, string>) {
        if (!databaseName) {
            throwError("InvalidArgumentException", "DatabaseName cannot be null");
        }

        this._databaseName = databaseName;

        if (!configurationSettings) {
            throwError("InvalidArgumentException", "ConfigurationSettings cannot be null");
        }

        this._configurationSettings = configurationSettings;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new PutDatabaseConfigurationSettingsCommand(this._configurationSettings, this._databaseName);
    }
}

class PutDatabaseConfigurationSettingsCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _configurationSettings: Record<string, string>;
    private readonly _databaseName: string;

    public constructor(configurationSettings: Record<string, string>, databaseName: string) {
        super();

        if (!databaseName) {
            throwError("InvalidArgumentException", "DatabaseName cannot be null");
        }

        this._databaseName = databaseName;

        if (!configurationSettings) {
            throwError("InvalidArgumentException", "ConfigurationSettings cannot be null");
        }

        this._configurationSettings = configurationSettings;
    }

    get isReadRequest(): boolean {
        return false;
    }

    getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + this._databaseName + "/admin/configuration/settings";

        const body = this._serializer.serialize(this._configurationSettings);

        return {
            uri,
            method: "PUT",
            headers: this._headers().typeAppJson().build(),
            body
        }
    }
}
