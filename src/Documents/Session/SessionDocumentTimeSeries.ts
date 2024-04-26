import { SessionTimeSeriesBase } from "./SessionTimeSeriesBase.js";
import { ISessionDocumentTimeSeries } from "./ISessionDocumentTimeSeries.js";
import { InMemoryDocumentSessionOperations } from "./InMemoryDocumentSessionOperations.js";
import { TimeSeriesEntry } from "./TimeSeries/TimeSeriesEntry.js";
import { TypeUtil } from "../../Utility/TypeUtil.js";
import { ITimeSeriesIncludeBuilder } from "./Loaders/ITimeSeriesIncludeBuilder.js";
import { ISessionDocumentIncrementalTimeSeries } from "./ISessionDocumentIncrementalTimeSeries.js";

export class SessionDocumentTimeSeries extends SessionTimeSeriesBase implements ISessionDocumentTimeSeries, ISessionDocumentIncrementalTimeSeries {

    public constructor(session: InMemoryDocumentSessionOperations, entity: any, name: string)
    public constructor(session: InMemoryDocumentSessionOperations, documentId: string, name: string)
    public constructor(session: InMemoryDocumentSessionOperations, documentIdOrEntity: string | any, name: string) {
        super(session, documentIdOrEntity, name);
    }

    public get(): Promise<TimeSeriesEntry[]>;
    public get(start: number, pageSize: number): Promise<TimeSeriesEntry[]>;
    public get(from: Date, to: Date): Promise<TimeSeriesEntry[]>;
    public get(from: Date, to: Date, start: number): Promise<TimeSeriesEntry[]>;
    public get(from: Date, to: Date, start: number, pageSize: number): Promise<TimeSeriesEntry[]>;
    public get(from: Date, to: Date, includes: (builder: ITimeSeriesIncludeBuilder) => void): Promise<TimeSeriesEntry[]>;
    public get(from: Date, to: Date, includes: (builder: ITimeSeriesIncludeBuilder) => void, start: number): Promise<TimeSeriesEntry[]>;
    public get(from: Date, to: Date, includes: (builder: ITimeSeriesIncludeBuilder) => void, start: number, pageSize: number): Promise<TimeSeriesEntry[]>;
    public get(
        startOrFrom?: number | Date,
        toOrPageSize?: number | Date,
        startOrIncludes?: number | ((builder: ITimeSeriesIncludeBuilder) => void),
        startOrPageSize?: number,
        pageSize?: number) {

        if (TypeUtil.isFunction(startOrIncludes)) {
            return this._getInternal(startOrFrom as Date, toOrPageSize as Date, startOrIncludes, startOrPageSize, pageSize);
        } else if (TypeUtil.isNumber(startOrIncludes)) {
            return this._getInternal(startOrFrom as Date, toOrPageSize as Date, null, startOrPageSize, pageSize);
        } else if (TypeUtil.isNumber(startOrFrom)) {
            // get(start: number, pageSize: number)
            return this._getInternal(null, null, null, startOrFrom, toOrPageSize as number);
        } else {
            return this._getInternal(startOrFrom, toOrPageSize as Date, null, 0, TypeUtil.MAX_INT32);
        }
    }

    private async _getInternal(from: Date, to: Date, includes: (builder: ITimeSeriesIncludeBuilder) => void, start: number, pageSize: number): Promise<TimeSeriesEntry[]> {
        if (this._notInCache(from, to)) {
            return this.getTimeSeriesAndIncludes(from, to, includes, start, pageSize);
        }

        const resultsToUser = await this._serveFromCache(from, to, start, pageSize, includes);

        if (!resultsToUser) {
            return null;
        }

        return resultsToUser.slice(0, pageSize);
    }

    public append(timestamp: Date, value: number): void;
    public append(timestamp: Date, value: number, tag: string): void;
    public append(timestamp: Date, values: number[]): void;
    public append(timestamp: Date, values: number[], tag: string): void;
    public append(timestamp: Date, valueOrValues: number[] | number, tag?: string): void {
        return this._appendInternal(timestamp, valueOrValues, tag);
    }

    public increment(timestamp: Date, values: number[]): void;
    public increment(values: number[]): void;
    public increment(timestamp: Date, value: number): void;
    public increment(value: number): void;
    public increment(timestampOrValuesOrValue: Date | number[] | number, valueOrValues?: number[] | number): void {
        if (TypeUtil.isDate(timestampOrValuesOrValue)) {
            const values = TypeUtil.isArray(valueOrValues) ? valueOrValues : [valueOrValues];
            return this._incrementInternal(timestampOrValuesOrValue, values);
        }

        const values = TypeUtil.isArray(timestampOrValuesOrValue) ? timestampOrValuesOrValue : [timestampOrValuesOrValue];
        return this._incrementInternal(new Date(), values);
    }
}
