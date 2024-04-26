import { ILazyOperation } from "./ILazyOperation.js";
import { ClusterTransactionOperationsBase } from "../../ClusterTransactionOperationsBase.js";
import { throwError } from "../../../../Exceptions/index.js";
import { GetRequest } from "../../../Commands/MultiGet/GetRequest.js";
import { GetResponse } from "../../../Commands/MultiGet/GetResponse.js";
import { TypeUtil } from "../../../../Utility/TypeUtil.js";
import {
    CompareExchangeValueResultParser,
    GetCompareExchangeValuesResponse
} from "../../../Operations/CompareExchange/CompareExchangeValueResultParser.js";
import { CompareExchangeResultClass, ServerCasing, ServerResponse } from "../../../../Types/index.js";
import { DocumentConventions } from "../../../Conventions/DocumentConventions.js";
import { QueryResult } from "../../../Queries/QueryResult.js";
import { GetCompareExchangeValuesCommand } from "../../../Operations/CompareExchange/GetCompareExchangeValuesOperation.js";

export class LazyGetCompareExchangeValueOperation<T> implements ILazyOperation {
    private readonly _clusterSession: ClusterTransactionOperationsBase;
    private readonly _clazz: CompareExchangeResultClass<T>;
    private readonly _conventions: DocumentConventions;
    private readonly _key: string;

    private _result: object;
    private _requiresRetry: boolean;

    public constructor(clusterSession: ClusterTransactionOperationsBase, clazz: CompareExchangeResultClass<T>,
                       conventions: DocumentConventions, key: string) {
        if (!clusterSession) {
            throwError("InvalidArgumentException", "Cluster Session cannot be null");
        }
        if (!conventions) {
            throwError("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!key) {
            throwError("InvalidArgumentException", "Key cannot be null");
        }

        this._clusterSession = clusterSession;
        this._clazz = clazz;
        this._conventions = conventions;
        this._key = key;
    }

    public get result() {
        return this._result;
    }

    public get queryResult(): QueryResult {
        throwError("NotImplementedException", "Not implemented");
        return null;
    }

    public get requiresRetry() {
        return this._requiresRetry;
    }

    createRequest(): GetRequest {
        if (this._clusterSession.isTracked(this._key)) {
            this._result = this._clusterSession.getCompareExchangeValueFromSessionInternal<T>(this._key, TypeUtil.NOOP, this._clazz);
            return null;
        }

        const request = new GetRequest();
        request.url = "/cmpxchg";
        request.method = "GET";
        request.query = "?key=" + encodeURIComponent(this._key);

        return request;
    }

    async handleResponseAsync(response: GetResponse): Promise<void> {
        if (response.forceRetry) {
            this._result = null;
            this._requiresRetry = true;
            return;
        }

        if (response.result) {
            const results = JSON.parse(response.result) as ServerCasing<ServerResponse<GetCompareExchangeValuesResponse>>;

            const localObject = GetCompareExchangeValuesCommand.mapToLocalObject(results);

            const value = CompareExchangeValueResultParser.getValue(localObject, false, this._conventions, null);

            if (this._clusterSession.session.noTracking) {
                if (!value) {
                    this._result = this._clusterSession.registerMissingCompareExchangeValue(this._key).getValue(this._clazz, this._conventions);
                    return;
                }

                this._result = this._clusterSession.registerCompareExchangeValue(value).getValue(this._clazz, this._conventions);
                return;
            }

            if (value) {
                this._clusterSession.registerCompareExchangeValue(value);
            }
        }

        if (!this._clusterSession.isTracked(this._key)) {
            this._clusterSession.registerMissingCompareExchangeValue(this._key);
        }

        this._result = this._clusterSession.getCompareExchangeValueFromSessionInternal(this._key, TypeUtil.NOOP, this._clazz);
    }
}
