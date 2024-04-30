import moment from "moment";
import { throwError } from "../Exceptions/index.js";

export interface DateUtilOpts {
    withTimezone?: boolean;
    useUtcDates?: boolean;
}

export class DateUtil {

    public static DEFAULT_DATE_FORMAT = "YYYY-MM-DDTHH:mm:ss.SSS0000";
    public static DEFAULT_DATE_TZ_FORMAT = "YYYY-MM-DDTHH:mm:ss.SSS0000Z";

    public static default: DateUtil = new DateUtil({});

    public static utc: DateUtil = new DateUtil({ useUtcDates: true });

    public constructor(protected opts: DateUtilOpts) {}

    public static timestamp(): number {
        return moment().unix();
    }

    public static timestampMs(): number {
        return moment().valueOf();
    }

    public static zeroDate(): Date {
        return moment([1, 1, 1]).toDate();
    }

    public parse(dateString: string): Date {
        if (!dateString) {
            return null;
        }

        let parsed;
        if (this.opts.useUtcDates || this.opts.withTimezone || dateString.endsWith("Z")) {
            parsed = moment.parseZone(dateString, DateUtil.DEFAULT_DATE_TZ_FORMAT);
        } else {
            parsed = moment(dateString, DateUtil.DEFAULT_DATE_FORMAT);
        }

        if (!parsed.isValid()) {
            throwError("InvalidArgumentException", `Could not parse date string '${dateString}'.`);
        }

        return parsed.toDate();
    }

    public stringify(date: Date): string {
        const m = moment(date);
        if (this.opts.useUtcDates) {
            m.utc();
        }

        const format = this.opts.withTimezone
            ? DateUtil.DEFAULT_DATE_TZ_FORMAT
            : DateUtil.DEFAULT_DATE_FORMAT;
        const result = m.format(format);
        if (this.opts.useUtcDates && !this.opts.withTimezone) {
            return result + "Z";
        }
        
        return result;
    }
}
