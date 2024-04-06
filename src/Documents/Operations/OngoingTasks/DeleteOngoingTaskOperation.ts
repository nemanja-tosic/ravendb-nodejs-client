import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions";
import { OngoingTaskType } from "./OngoingTaskType";
import { HttpRequestParameters } from "../../../Primitives/Http";
import { Stream } from "node:stream";
import { ModifyOngoingTaskResult } from "../../../ServerWide/ModifyOnGoingTaskResult";
import { DocumentConventions } from "../../Conventions/DocumentConventions";
import { RavenCommand } from "../../../Http/RavenCommand";
import { ServerNode } from "../../../Http/ServerNode";
import { IRaftCommand } from "../../../Http/IRaftCommand";
import { RaftIdGenerator } from "../../../Utility/RaftIdGenerator";

export class DeleteOngoingTaskOperation implements IMaintenanceOperation<ModifyOngoingTaskResult> {
    private readonly _taskId: number;
    private readonly _taskType: OngoingTaskType;

    public constructor(taskId: number, taskType: OngoingTaskType) {
        this._taskId = taskId;
        this._taskType = taskType;
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    getCommand(conventions: DocumentConventions): RavenCommand<ModifyOngoingTaskResult> {
        return new DeleteOngoingTaskCommand(this._taskId, this._taskType);
    }
}

class DeleteOngoingTaskCommand extends RavenCommand<ModifyOngoingTaskResult> implements IRaftCommand {
    private readonly _taskId: number;
    private readonly _taskType: OngoingTaskType;

    public constructor(taskId: number, taskType: OngoingTaskType) {
        super();

        this._taskId = taskId;
        this._taskType = taskType;
    }

    createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/admin/tasks?id=" + this._taskId + "&type=" + this._taskType;

        return {
            uri,
            method: "DELETE"
        }
    }

    async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        return this._parseResponseDefaultAsync(bodyStream);
    }

    get isReadRequest(): boolean {
        return false;
    }

    public getRaftUniqueRequestId(): string {
        return RaftIdGenerator.newId();
    }
}