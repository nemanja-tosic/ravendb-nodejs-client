import { QueryToken } from "./QueryToken.js";
import { TimeSeriesRange } from "../../Operations/TimeSeries/TimeSeriesRange.js";
import { StringUtil } from "../../../Utility/StringUtil.js";
import { DateUtil } from "../../../Utility/DateUtil.js";
import { StringBuilder } from "../../../Utility/StringBuilder.js";
import { AbstractTimeSeriesRange } from "../../Operations/TimeSeries/AbstractTimeSeriesRange.js";
import { TimeSeriesTimeRange } from "../../Operations/TimeSeries/TimeSeriesTimeRange.js";
import { throwError } from "../../../Exceptions/index.js";
import { TimeSeriesCountRange } from "../../Operations/TimeSeries/TimeSeriesCountRange.js";

export class TimeSeriesIncludesToken extends QueryToken {
    private _sourcePath: string;
    private readonly _range: AbstractTimeSeriesRange;

    private constructor(sourcePath: string, range: AbstractTimeSeriesRange) {
        super();

        this._range = range;
        this._sourcePath = sourcePath;
    }

    public static create(sourcePath: string, range: AbstractTimeSeriesRange) {
        return new TimeSeriesIncludesToken(sourcePath, range);
    }

    public addAliasToPath(alias: string) {
        this._sourcePath = StringUtil.isNullOrEmpty(this._sourcePath)
            ? alias
            : alias + "." + this._sourcePath;
    }

    writeTo(writer: StringBuilder) {
        writer
            .append("timeseries(");

        if (!StringUtil.isNullOrEmpty(this._sourcePath)) {
            writer
                .append(this._sourcePath)
                .append(", ");
        }

        if (!StringUtil.isNullOrEmpty(this._range.name)) {
            writer
                .append("'")
                .append(this._range.name)
                .append("'")
                .append(", ");
        }

        if ("count" in this._range) {
            TimeSeriesIncludesToken._writeCountRangeTo(writer, this._range as TimeSeriesCountRange);
        } else if ("time" in this._range) {
            TimeSeriesIncludesToken._writeTimeRangeTo(writer, this._range as TimeSeriesTimeRange);
        } else if ("from" in this._range && "to" in this._range) {
            TimeSeriesIncludesToken._writeRangeTo(writer, this._range as TimeSeriesRange);
        } else {
            throwError("InvalidArgumentException", "Not supported time range type: " + this._range);
        }

        writer
            .append(")");
    }

    private static _writeTimeRangeTo(writer: StringBuilder, range: TimeSeriesTimeRange) {
        switch (range.type) {
            case "Last": {
                writer
                    .append("last(");
                break;
            }
            default: {
                throwError("InvalidArgumentException", "Not supported time range type: " + range.type);
            }
        }

        writer
            .append(range.time.value)
            .append(", '")
            .append(range.time.unit)
            .append("')");
    }

    private static _writeCountRangeTo(writer: StringBuilder, range: TimeSeriesCountRange) {
        switch (range.type) {
            case "Last": {
                writer
                    .append("last(");
                break;
            }
            default: {
                throwError("InvalidArgumentException", "Not supported time range type: " + range.type);
            }
        }

        writer
            .append(range.count)
            .append(")");
    }

    private static _writeRangeTo(writer: StringBuilder, range: TimeSeriesRange) {
        if (range.from) {
            writer
                .append("'")
                .append(DateUtil.utc.stringify(range.from))
                .append("'")
                .append(", ");
        } else {
            writer
                .append("null,");
        }

        if (range.to) {
            writer
                .append("'")
                .append(DateUtil.utc.stringify(range.to))
                .append("'");
        } else {
            writer
                .append("null");
        }
    }
}
