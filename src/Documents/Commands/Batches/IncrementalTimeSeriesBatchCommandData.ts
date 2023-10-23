import { TimeSeriesBatchCommandData } from "./TimeSeriesBatchCommandData";
import { CommandType } from "../CommandData";
import { TimeSeriesCommandData } from "./TimeSeriesCommandData";


export class IncrementalTimeSeriesBatchCommandData extends TimeSeriesCommandData {

    public constructor(documentId: string, name: string, increments: IncrementOperation[]) {
        super(documentId, name);

        if (increments) {
            for (const incrementOperation of increments) {
                this.timeSeries.increment(incrementOperation);
            }
        }
    }

    public get type(): CommandType {
        return "TimeSeriesWithIncrements";
    }
}
