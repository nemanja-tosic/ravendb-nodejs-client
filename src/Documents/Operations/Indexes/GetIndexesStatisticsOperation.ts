import { DocumentConventions } from "../../Conventions/DocumentConventions.js";
import { IMaintenanceOperation, OperationResultType } from "../OperationAbstractions.js";
import { IndexStats, CollectionStats } from "../../Indexes/IndexStats.js";
import { HttpRequestParameters } from "../../../Primitives/Http.js";
import { ServerNode } from "../../../Http/ServerNode.js";
import { RavenCommand } from "../../../Http/RavenCommand.js";
import { Stream } from "node:stream";

export class GetIndexesStatisticsOperation implements IMaintenanceOperation<IndexStats[]> {

    public get resultType(): OperationResultType {
        return "CommandResult";
    }

    public getCommand(conventions: DocumentConventions): RavenCommand<IndexStats[]> {
        return new GetIndexesStatisticsCommand(conventions);
    }

}

const typeInfo = {
    nestedTypes: {
        "results[].collections": "Map",
        "results[].collections$MAP": "CollectionStats"
    }
};

const knownTypes = new Map([[CollectionStats.name, CollectionStats]]);

export class GetIndexesStatisticsCommand extends RavenCommand<IndexStats[]> {
    private readonly _conventions: DocumentConventions;
    public constructor(conventions: DocumentConventions) {
        super();
        this._conventions = conventions;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/indexes/stats";
        return { uri };
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this._throwInvalidResponse();
        }

        let body: string = null;
        const results = await this._defaultPipeline(_ => body = _).process(bodyStream);
        for (const r of results["results"]) {
            r.collections = Object.keys(r.collections)
                .reduce((result, next) => [ ...result, [ next, result[next] ]], []);
        }

        const obj = this._reviveResultTypes(
            results,
            this._conventions,
            typeInfo,
            knownTypes);

        this.result = obj["results"];
        return body;
    }

    public get isReadRequest(): boolean {
        return true;
    }
}
