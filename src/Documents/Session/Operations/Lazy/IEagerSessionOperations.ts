import {ResponseTimeInformation} from "../../ResponseTimeInformation";

/**
 * Allow to perform eager operations on the session
 */
export interface IEagerSessionOperations {
    executeAllPendingLazyOperations(): Promise<ResponseTimeInformation>;
}
