import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { TimeUtil } from "../../../Utility/TimeUtil.js";

export class DelayBackupOperation implements IMaintenanceOperation<void> {
    private readonly _runningBackupTaskId: number;
    private readonly _duration: number;

    public constructor(runningBackupTaskId: number, duration: number) {
        this._runningBackupTaskId = runningBackupTaskId;
        this._duration = duration;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<void> {
        return new DelayBackupCommand(this._runningBackupTaskId, this._duration);
    }
}

class DelayBackupCommand extends RavenCommand<void> {
    private readonly _taskId: number;
    private readonly _duration: number;

    public constructor(taskId: number, duration: number) {
        super();

        this._taskId = taskId;
        this._duration = duration;
    }

    get isReadRequest(): boolean {
        return true;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/admin/backup-task/delay?taskId=" + this._taskId + "&duration=" + TimeUtil.durationToTimeSpan(this._duration) + "&database=" + node.database;

        return {
            uri,
            method: "POST"
        }
    }
}
