import { HttpRequestParameters } from "../../Primitives/Http";
import { RavenCommand } from "../../Http/RavenCommand";
import { QueryResult } from "../Queries/QueryResult";
import { DocumentConventions } from "../Conventions/DocumentConventions";
import { IndexQuery, writeIndexQuery } from "../Queries/IndexQuery";
import { throwError } from "../../Exceptions";
import { ServerNode } from "../../Http/ServerNode";
import { JsonSerializer } from "../../Mapping/Json/Serializer";
import * as stream from "readable-stream";
import { RavenCommandResponsePipeline } from "../../Http/RavenCommandResponsePipeline";
import { StringBuilder } from "../../Utility/StringBuilder";
import { ServerCasing, ServerResponse } from "../../Types";
import { finishedAsync, readToEnd } from "../../Utility/StreamUtil";
import { User } from "../../../test/Assets/Entities";
import { Order } from "../../../test/Assets/Orders";
import { QueryTimings } from "../Queries/Timings/QueryTimings";
import { StringUtil } from "../../Utility/StringUtil";
import { CounterDetail } from "../Operations/Counters/CounterDetail";
import { ICompareExchangeValue } from "../Operations/CompareExchange/ICompareExchangeValue";
import { CompareExchangeResultItem } from "../Operations/CompareExchange/CompareExchangeValueResultParser";
import { TimeSeriesRangeResult } from "../Operations/TimeSeries/TimeSeriesRangeResult";
import { TimeSeriesEntry } from "../Session/TimeSeries/TimeSeriesEntry";

export interface QueryCommandOptions {
    metadataOnly?: boolean;
    indexEntriesOnly?: boolean;
}

export class QueryCommand extends RavenCommand<QueryResult> {

    protected _conventions: DocumentConventions;
    private readonly _indexQuery: IndexQuery;
    private readonly _metadataOnly: boolean;
    private readonly _indexEntriesOnly: boolean;

    public constructor(
        conventions: DocumentConventions, indexQuery: IndexQuery, opts: QueryCommandOptions) {
        super();

        this._conventions = conventions;

        if (!indexQuery) {
            throwError("InvalidArgumentException", "indexQuery cannot be null.");
        }

        this._indexQuery = indexQuery;

        opts = opts || {};
        this._metadataOnly = opts.metadataOnly;
        this._indexEntriesOnly = opts.indexEntriesOnly;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        this._canCache = !this._indexQuery.disableCaching;

        // we won't allow aggressive caching of queries with WaitForNonStaleResults
        this._canCacheAggressively = this._canCache && !this._indexQuery.waitForNonStaleResults;

        const path = new StringBuilder(node.url)
            .append("/databases/")
            .append(node.database)
            .append("/queries?queryHash=")
            // we need to add a query hash because we are using POST queries
            // so we need to unique parameter per query so the query cache will
            // work properly
            .append(this._indexQuery.getQueryHash());

        if (this._metadataOnly) {
            path.append("&metadataOnly=true");
        }

        if (this._indexEntriesOnly) {
            path.append("&debug=entries");
        }

        path.append("&addTimeSeriesNames=true");

        const uri = path.toString();
        const body = writeIndexQuery(this._conventions, this._indexQuery);
        const headers = this._headers().typeAppJson().build();
        return {
            method: "POST",
            uri,
            headers,
            body
        };
    }

    protected get _serializer(): JsonSerializer {
        return super._serializer;
    }

    public async setResponseAsync(bodyStream: stream.Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this.result = null;
            return;
        }

        let body: string = null;
        this.result = await QueryCommand.parseQueryResultResponseAsync(
            bodyStream, this._conventions, fromCache, b => body = b);

        return body;
    }

    public get isReadRequest(): boolean {
        return true;
    }

    public static async parseQueryResultResponseAsync(
        bodyStream: stream.Stream,
        conventions: DocumentConventions,
        fromCache: boolean,
        bodyCallback?: (body: string) => void): Promise<QueryResult> {

        const body = await readToEnd(bodyStream);
        bodyCallback?.(body);

        const json = JSON.parse(body); //TODO: parse sync or async
        const queryResult = QueryCommand._mapToLocalObject(json, conventions);

        if (fromCache) {
            queryResult.durationInMs = -1;

            if (queryResult.timingsInMs) {
                queryResult.timingsInMs.durationInMs = -1;
                queryResult.timingsInMs = null;
            }
        }

        return queryResult;
    }

    private static _mapCompareExchangeToLocalObject(json: Record<string, ServerCasing<CompareExchangeResultItem>>): Record<string, CompareExchangeResultItem> {
        if (!json) {
            return undefined;
        }

        const result: Record<string, CompareExchangeResultItem> = {};

        for (const [key, value] of Object.entries(json)) {
            result[key] = {
                index: value.Index,
                key: value.Key,
                value: {
                    object: value.Value?.Object
                }
            }
        }

        return result;
    }

    private static _mapTimingsToLocalObject(timings: ServerCasing<QueryTimings>) {
        if (!timings) {
            return undefined;
        }

        const mapped = new QueryTimings();
        mapped.durationInMs = timings.DurationInMs;
        mapped.timings = timings.Timings ? {} : undefined;
        if (timings.Timings) {
            Object.keys(timings.Timings).forEach(time => {
                mapped.timings[StringUtil.uncapitalize(time)] = QueryCommand._mapTimingsToLocalObject(timings.Timings[time]);
            });
        }
        return mapped;
    }

    private static _mapTimeSeriesIncludesToLocalObject(json: Record<string, Record<string, ServerCasing<ServerResponse<TimeSeriesRangeResult>>[]>>) {
        if (!json) {
            return undefined;
        }

        const result: Record<string, Record<string, ServerResponse<TimeSeriesRangeResult>[]>> = {};

        for (const [docId, perDocumentTimeSeries] of Object.entries(json)) {
            const perDocumentResult: Record<string, ServerResponse<TimeSeriesRangeResult>[]> = {};

            for (const [tsName, tsData] of Object.entries(perDocumentTimeSeries)) {
                perDocumentResult[tsName] = tsData.map(ts => {
                    return {
                        from: ts.From,
                        to: ts.To,
                        totalResults: ts.TotalResults,
                        entries: ts.Entries.map(entry => ({
                            timestamp: entry.Timestamp,
                            isRollup: entry.IsRollup,
                            tag: entry.Tag,
                            values: entry.Values,
                        } as ServerResponse<TimeSeriesEntry>))
                    };
                })
            }

            result[docId] = perDocumentResult;
        }

        return result;
    }

    private static _mapToLocalObject(json: ServerCasing<ServerResponse<QueryResult>>, conventions: DocumentConventions): QueryResult {
        const remoteCounters = json.CounterIncludes as Record<string, ServerCasing<CounterDetail>[]>;
        const counterIncludes: Record<string, CounterDetail[]> = remoteCounters ? {} : undefined;

        if (remoteCounters) {
            for (const [key, value] of Object.entries(remoteCounters)) {
                counterIncludes[key] = value.map(c => {
                    return c ? {
                        changeVector: c.ChangeVector,
                        counterName: c.CounterName,
                        counterValues: c.CounterValues,
                        documentId: c.DocumentId,
                        etag: c.Etag,
                        totalValue: c.TotalValue
                    } : null;
                });
            }
        }
        const props: Omit<QueryResult, "scoreExplanations" | "cappedMaxResults" | "createSnapshot" | "resultSize"> = {
            results: json.Results, //TODO:
            includes: json.Includes, //TODO:
            indexName: json.IndexName,
            indexTimestamp: conventions.dateUtil.parse(json.IndexTimestamp),
            includedPaths: json.IncludedPaths,
            isStale: json.IsStale,
            skippedResults: json.SkippedResults,
            totalResults: json.TotalResults,
            highlightings: json.Highlightings,
            explanations: json.Explanations,
            timingsInMs: json.TimingsInMs,
            lastQueryTime: conventions.dateUtil.parse(json.LastQueryTime),
            durationInMs: json.DurationInMs,
            resultEtag: json.ResultEtag,
            nodeTag: json.NodeTag,
            counterIncludes: counterIncludes,
            includedCounterNames: json.IncludedCounterNames,
            timeSeriesIncludes: QueryCommand._mapTimeSeriesIncludesToLocalObject(json.TimeSeriesIncludes),
            compareExchangeValueIncludes: QueryCommand._mapCompareExchangeToLocalObject(json.CompareExchangeValueIncludes),
            timeSeriesFields: json.TimeSeriesFields,
            timings: QueryCommand._mapTimingsToLocalObject(json.Timings)
            /* TODO
        // len === 2 is array index
        if (stack[0] === "Results" || stack[0] === "Includes") {
            if (len === 3) {
                // top document level
                return key === "@metadata" ? null : entityCasingConvention;
            }
            if (len === 4) {
                if (stack[2] === "@metadata") {
                    // handle @metadata object keys
                    if (key[0] === "@" || key === "Raven-Node-Type") {
                        return null;
                    }
                }
            }
            if (len === 5) {
                // do not touch @nested-object-types keys
                if (stack[len - 2] === "@nested-object-types") {
                    return null;
                }
            }
            if (len === 6) {
                // @metadata.@attachments.[].name
                if (stack[2] === "@metadata") {
                    if (stack[3] === "@attachments") {
                        return "camel";
                    }

                    return null;
                }
            }
        }
             */
        }

        return Object.assign(new QueryResult(), props);
    }
}
