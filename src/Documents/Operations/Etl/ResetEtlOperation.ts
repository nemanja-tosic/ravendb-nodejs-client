import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { IRaftCommand } from "../../../Http/IRaftCommand.js";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator.js";
import { throwError } from "../../../Exceptions/index.js";

export class ResetEtlOperation implements IMaintenanceOperation<void> {
    private readonly _configurationName: string;
    private readonly _transformationName: string;

    public constructor(configurationName: string, transformationName: string) {
        if (!configurationName) {
            throwError("InvalidArgumentException", "ConfigurationName cannot be null");
        }

        if (!transformationName) {
            throwError("InvalidArgumentException", "TransformationName cannot be null");
        }
        this._configurationName = configurationName;
        this._transformationName = transformationName;
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new ResetEtlCommand(this._configurationName, this._transformationName);
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }
}

class ResetEtlCommand extends RavenCommand<void> implements IRaftCommand {
    private readonly _configurationName: string;
    private readonly _transformationName: string;

    public constructor(configurationName: string, transformationName: string) {
        super();
        this._configurationName = configurationName;
        this._transformationName = transformationName;
        this._responseType = "Empty";
    }

    get isReadRequest(): boolean {
        return false;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/etl?configurationName="
            + encodeURIComponent(this._configurationName)
            + "&transformationName=" + encodeURIComponent(this._transformationName);

        const body = "{}";
        const headers = this._headers().typeAppJson().build();

        return {
            method: "RESET",
            headers,
            body,
            uri
        }
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}