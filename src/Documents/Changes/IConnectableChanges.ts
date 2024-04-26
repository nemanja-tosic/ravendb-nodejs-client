import { IDatabaseChanges } from "./IDatabaseChanges.js";
import { IDisposable } from "../../Types/Contracts.js";

export interface IConnectableChanges<T extends IDatabaseChanges> extends IDisposable {

    connected: boolean;

    ensureConnectedNow(): Promise<IDatabaseChanges>;

    on(type: "connectionStatus", handler: () => void);
    on(type: "error", handler: (error: Error) => void);

    off(type: "connectionStatus", handler: () => void);
    off(type: "error", handler: (error: Error) => void);
}
