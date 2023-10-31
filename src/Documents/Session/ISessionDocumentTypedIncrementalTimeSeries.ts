import { ISessionDocumentDeleteTimeSeriesBase } from "./ISessionDocumentDeleteTimeSeriesBase";
import { ISessionDocumentIncrementTimeSeriesBase } from "./ISessionDocumentIncrementTimeSeriesBase";
import { ISessionDocumentTypedIncrementTimeSeriesBase } from "./ISessionDocumentTypedIncrementTimeSeriesBase";


export interface ISessionDocumentTypedIncrementalTimeSeries<TValues extends object> extends ISessionDocumentDeleteTimeSeriesBase,
    ISessionDocumentIncrementTimeSeriesBase, ISessionDocumentTypedIncrementTimeSeriesBase<TValues> {

    /* TODO
    /**
+     * Return the time series values for the provided range
+     * @return time series values
+     *
    +    TypedTimeSeriesEntry<TValues>[] get();
    +
    +    /**
     +     * Return the time series values for the provided range
     +     * @param from range start
     +     * @param to range end
     +     * @return time series values
     +     *
    +    TypedTimeSeriesEntry<TValues>[] get(Date from, Date to);
    +
    +    /**
     +     * Return the time series values for the provided range
     +     * @param from range start
     +     * @param to range end
     +     * @param start start
     +     * @return time series values
     +     *
    +    TypedTimeSeriesEntry<TValues>[] get(Date from, Date to, int start);
    +
    +    /**
     +     * Return the time series values for the provided range
     +     * @param from range start
     +     * @param to range end
     +     * @param start start
     +     * @param pageSize page size
     +     * @return time series values
     +     *
    +    TypedTimeSeriesEntry<TValues>[] get(Date from, Date to, int start, int pageSize);
     */
}
