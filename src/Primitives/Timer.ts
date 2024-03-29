import { IDisposable } from "../Types/Contracts";
import { getLogger } from "../Utility/LogUtil";

const log = getLogger({ module: "Timer" });

export class Timer implements IDisposable {

    private _action: () => Promise<any>;

    private _scheduledActionPromise: Promise<any>;

    private _firstTimeDelayId: ReturnType<typeof setInterval>;
    private _intervalId: ReturnType<typeof setInterval>;

    private _intervalTimerId: ReturnType<typeof setInterval>;

    /** period in milliseconds */
    private _periodInMs: number;

    constructor(action: () => Promise<any>, dueTimeInMs: number, periodInMs?: number) {
        this._action = action;
        this._periodInMs = periodInMs;
        if (dueTimeInMs != null) {
            this._schedule(dueTimeInMs);
        }
    }

    public change(dueTimeInMs: number, period?: number) {
        this._periodInMs = period;
        this._clearTimers();
        this._schedule(dueTimeInMs);
    }

    private _schedule(dueTimeInMs: number) {
        this._firstTimeDelayId = setTimeout(() => {

            if (this._periodInMs) {
                this._intervalId = setInterval(
                    () => this._timerAction(), this._periodInMs);
            }

            this._timerAction();

        }, dueTimeInMs);
    }

    private _timerAction() {
        log.info(`Start timer action ${this._action.name}`);

        const actionPromise = async () => {
            try {
                return await this._action();
            } catch (e) {
                log.warn(`Error executing timer action ${this._action.name}.`, e);
                throw e;
            } finally {
                log.info(`Finish timer action ${this._action.name}.`)
            }
        }
        this._scheduledActionPromise = actionPromise();
    }

    private _clearTimers() {
        clearTimeout(this._firstTimeDelayId);
        clearInterval(this._intervalId);
    }

    public dispose(): void {
        log.info(`Dispose ${this._action.name}.`);
        this._clearTimers();
    }
}
