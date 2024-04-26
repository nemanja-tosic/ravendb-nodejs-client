import { IDisposable } from "../../Types/Contracts.js";
import { DocumentStoreBase } from "../DocumentStoreBase.js";
import { IServerOperation, AwaitableServerOperation, OperationIdResult } from "./OperationAbstractions.js";
import { ClusterRequestExecutor } from "../../Http/ClusterRequestExecutor.js";
import { RavenCommand } from "../../Http/RavenCommand.js";
import { ServerWideOperationCompletionAwaiter } from "../../ServerWide/Operations/ServerWideOperationCompletionAwaiter.js";
import { getLogger } from "../../Utility/LogUtil.js";
import { throwError } from "../../Exceptions/index.js";
import { StringUtil } from "../../Utility/StringUtil.js";
import { Topology } from "../../Http/Topology.js";
import { GetBuildNumberOperation } from "../../ServerWide/Operations/GetBuildNumberOperation.js";
import { IRequestExecutorOptions } from "../../Http/RequestExecutor.js";

const log = getLogger({ module: "ServerOperationExecutor" });

export class ServerOperationExecutor implements IDisposable {

    private readonly _cache: Map<string, ServerOperationExecutor>;
    private readonly _nodeTag: string;
    private readonly _store: DocumentStoreBase;
    private readonly _requestExecutor: ClusterRequestExecutor;
    private readonly _initialRequestExecutor: ClusterRequestExecutor;

    public constructor(store: DocumentStoreBase);
    public constructor(store: DocumentStoreBase,
                       requestExecutor: ClusterRequestExecutor,
                       initialRequestExecutor: ClusterRequestExecutor,
                       cache: Map<string, ServerOperationExecutor>,
                       nodeTag: string);
    public constructor(store: DocumentStoreBase,
                       requestExecutor?: ClusterRequestExecutor,
                       initialRequestExecutor?: ClusterRequestExecutor,
                       cache?: Map<string, ServerOperationExecutor>,
                       nodeTag?: string) {
        requestExecutor = requestExecutor || ServerOperationExecutor._createRequestExecutor(store);
        cache = cache || new Map<string, ServerOperationExecutor>();

        if (!store) {
            throwError("InvalidArgumentException", "Store cannot be null");
        }

        if (!requestExecutor) {
            throwError("InvalidArgumentException", "RequestExecutor cannot be null");
        }

        this._store = store;
        this._requestExecutor = requestExecutor;
        this._initialRequestExecutor = initialRequestExecutor;
        this._nodeTag = nodeTag;
        this._cache = cache;

        store.registerEvents(this._requestExecutor);

        if (!nodeTag) {
            store.once("afterDispose",
                (callback) => {
                    log.info("Dispose request executor.");
                    this._requestExecutor.dispose();
                    callback();
                });
        }
    }

    public async forNode(nodeTag: string): Promise<ServerOperationExecutor> {
        if (StringUtil.isNullOrWhitespace(nodeTag)) {
            throwError("InvalidArgumentException", "Value cannot be null or whitespace.");
        }

        if ((!nodeTag && !this._nodeTag) || StringUtil.equalsIgnoreCase(this._nodeTag, nodeTag)) {
            return this;
        }

        if (this._store.conventions.disableTopologyUpdates) {
            throwError("InvalidOperationException", "Cannot switch server operation executor, because conventions.disableTopologyUpdates is set to 'true'");
        }

        const existingValue = this._cache.get(nodeTag.toLowerCase());
        if (existingValue) {
            return existingValue;
        }

        const requestExecutor = this._initialRequestExecutor || this._requestExecutor;
        const topology: Topology = await this._getTopology(requestExecutor);

        const node = topology.nodes
            .find(x => StringUtil.equalsIgnoreCase(x.clusterTag, nodeTag));

        if (!node) {
            const availableNodes = topology
                .nodes
                .map(x => x.clusterTag)
                .join(", ");

            throwError("InvalidOperationException",
                "Could not find node '" + nodeTag + "' in the topology. Available nodes: " + availableNodes);
        }

        const clusterExecutor = ClusterRequestExecutor.createForSingleNode(node.url, {
            authOptions: this._store.authOptions
        });

        return new ServerOperationExecutor(this._store, clusterExecutor, requestExecutor, this._cache, node.clusterTag);
    }

    public async send(operation: AwaitableServerOperation): Promise<ServerWideOperationCompletionAwaiter>;
    public async send<TResult>(operation: IServerOperation<TResult>): Promise<TResult>;
    public async send<TResult>(operation: AwaitableServerOperation | IServerOperation<TResult>)
        : Promise<ServerWideOperationCompletionAwaiter | TResult> {

        const command = operation.getCommand(this._requestExecutor.conventions);

        await this._requestExecutor.execute(command as RavenCommand<TResult>);

        if (operation.resultType === "OperationId") {
            const idResult = command.result as OperationIdResult;
            return new ServerWideOperationCompletionAwaiter(
                this._requestExecutor, this._requestExecutor.conventions, idResult.operationId,
                command.selectedNodeTag || idResult.operationNodeTag
            );
        }

        return command.result as TResult;
    }

    public dispose(): void {
        if (this._nodeTag) {
            return;
        }

        if (this._requestExecutor) {
            this._requestExecutor.dispose();
        }

        if (this._cache) {
            for (const [key, value] of this._cache.entries()) {
                const requestExecutor = value._requestExecutor;
                if (requestExecutor) {
                    requestExecutor.dispose();
                }
            }

            this._cache.clear();
        }
    }

    private async _getTopology(requestExecutor: ClusterRequestExecutor): Promise<Topology> {
        let topology: Topology = null;
        try {
            topology = requestExecutor.getTopology();
            if (!topology) {
                // a bit rude way to make sure that topology has been refreshed
                // but it handles a case when first topology update failed

                const operation  = new GetBuildNumberOperation();
                const command = operation.getCommand(requestExecutor.conventions);
                await requestExecutor.execute(command);
                topology = requestExecutor.getTopology();
            }
        } catch {
            // ignored
        }

        if (!topology) {
            throwError("InvalidOperationException", "Could not fetch the topology");
        }

        return topology;
    }

    private static _createRequestExecutor(store: DocumentStoreBase): ClusterRequestExecutor {
        const args: IRequestExecutorOptions = {
            authOptions: store.authOptions,
            documentConventions: store.conventions
        };
        return store.conventions.disableTopologyUpdates
            ? ClusterRequestExecutor.createForSingleNode(store.urls[0], args)
            : ClusterRequestExecutor.create(store.urls, args);
    }
}
