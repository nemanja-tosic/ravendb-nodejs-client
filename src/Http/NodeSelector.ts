import { ArrayUtil } from "../Utility/ArrayUtil";
import * as moment from "moment";
import { ServerNode } from "../Http/ServerNode";
import CurrentIndexAndNode from "../Http/CurrentIndexAndNode";
import { Topology } from "./Topology";
import { Timer } from "../Primitives/Timer";
import { throwError } from "../Exceptions";
import { StringUtil } from "../Utility/StringUtil";
import { CurrentIndexAndNodeAndEtag } from "./CurrentIndexAndNodeAndEtag";

class NodeSelectorState {
    public topology: Topology;
    public nodes: ServerNode[];
    public failures: number[];
    public fastestRecords: number[];
    public fastest: number;
    public speedTestMode = 1;
    public unlikelyEveryoneFaultedChoiceIndex: number;

    constructor(topology: Topology) {
        this.topology = topology;
        this.nodes = topology.nodes;
        this.failures = ArrayUtil.range(topology.nodes.length, () => 0);
        this.fastestRecords = ArrayUtil.range(topology.nodes.length, () => 0);
        this.unlikelyEveryoneFaultedChoiceIndex = 0;
    }

    public getNodeWhenEveryoneMarkedAsFaulted(): CurrentIndexAndNode {
        const index = this.unlikelyEveryoneFaultedChoiceIndex;
        this.unlikelyEveryoneFaultedChoiceIndex = (this.unlikelyEveryoneFaultedChoiceIndex + 1) % this.nodes.length;


        return new CurrentIndexAndNode(index, this.nodes[index]);
    }
}

export class NodeSelector {

    private _updateFastestNodeTimer: Timer;
    private _state: NodeSelectorState;

    constructor(topology: Topology) {
        this._state = new NodeSelectorState(topology);
    }

    public getTopology(): Topology {
        return this._state.topology;
    }

    public onFailedRequest(nodeIndex: number): void {
        const state: NodeSelectorState = this._state;
        if (nodeIndex < 0 || nodeIndex >= state.failures.length) {
            return; // probably already changed
        }

        state.failures[nodeIndex]++;
    }

    public onUpdateTopology(topology: Topology, forceUpdate: boolean = false): boolean {
        if (!topology) {
            return false;
        }

        const stateEtag: number = this._state.topology.etag || 0;
        const topologyEtag: number = topology.etag || 0;

        if (stateEtag >= topologyEtag && !forceUpdate) {
            return false;
        }

        this._state = new NodeSelectorState(topology);

        return true;
    }

    public getNodeBySessionId(sessionId: number): CurrentIndexAndNode {
        const state = this._state;

        if (state.topology.nodes.length === 0) {
            throwError("DatabaseDoesNotExistException", "There are no nodes in the topology at all");
        }

        const index = Math.abs(sessionId % state.topology.nodes.length);

        for (let i = index; i < state.failures.length; i++) {
            if (state.failures[i] === 0
                && state.nodes[i].serverRole === "Member") {
                return new CurrentIndexAndNode(i, state.nodes[i]);
            }
        }

        for (let i = 0; i < index; i++) {
            if (state.failures[i] === 0
                && state.nodes[i].serverRole === "Member") {
                return new CurrentIndexAndNode(i, state.nodes[i]);
            }
        }

        return this.getPreferredNode();
    }

    public getRequestedNode(nodeTag: string): CurrentIndexAndNode {
        const state = this._state;
        const serverNodes = state.nodes;

        for (let i = 0; i < serverNodes.length; i++) {
            if (serverNodes[i].clusterTag === nodeTag) {
                return new CurrentIndexAndNode(i, serverNodes[i]);
            }
        }

        if (!state.nodes.length) {
            throwError("AllTopologyNodesDownException", "There are no nodes in the topology at all.");
        }

        throwError("RequestedNodeUnavailableException", "Could not find requested node " + nodeTag);
    }

    public nodeIsAvailable(index: number) {
        return this._state.failures[index] === 0;
    }

    public getPreferredNode(): CurrentIndexAndNode {
        const state = this._state;
        return NodeSelector.getPreferredNodeInternal(state);
    }

    public static getPreferredNodeInternal(state: NodeSelectorState): CurrentIndexAndNode {
        const stateFailures = state.failures;
        const serverNodes = state.nodes;
        const len = Math.min(serverNodes.length, stateFailures.length);

        for (let i = 0; i < len; i++) {
            if (stateFailures[i] === 0 && "Member" === serverNodes[i].serverRole) {
                return new CurrentIndexAndNode(i, serverNodes[i]);
            }
        }

        return NodeSelector._unlikelyEveryoneFaultedChoice(state);
    }

    public getNodeSelectorFailures() {
        return this._state.failures;
    }

    private static _unlikelyEveryoneFaultedChoice(state: NodeSelectorState): CurrentIndexAndNode {
        // if there are all marked as failed, we'll choose the next (the one in CurrentNodeIndex)
        // one so the user will get an error (or recover :-) );
        if (state.nodes.length === 0) {
            throwError("DatabaseDoesNotExistException", "There are no nodes in the topology at all.");
        }

        const stateFailures = state.failures;
        const serverNodes = state.nodes;

        const len = Math.min(serverNodes.length, stateFailures.length);

        for (let i = 0; i < len; i++) {
            if (stateFailures[i] === 0) {
                return new CurrentIndexAndNode(i, serverNodes[i]);
            }
        }

        return state.getNodeWhenEveryoneMarkedAsFaulted();
    }

    public getFastestNode(): CurrentIndexAndNode {
        const state = this._state;
        if (state.failures[state.fastest] === 0
            && state.nodes[state.fastest].serverRole === "Member") {
            return new CurrentIndexAndNode(state.fastest, state.nodes[state.fastest]);
        }

        // if the fastest node has failures, we'll immediately schedule
        // another run of finding who the fastest node is, in the meantime
        // we'll just use the server preferred node or failover as usual

        this._switchToSpeedTestPhase();
        return this.getPreferredNode();
    }

    public restoreNodeIndex(node: ServerNode): void {
        const state = this._state;
        const nodeIndex = state.nodes.indexOf(node);
        if (nodeIndex === -1) {
            return;
        }

        state.failures[nodeIndex] = 0;
    }

    protected _throwEmptyTopology(): void {
        throwError("InvalidOperationException", "Empty database topology, this shouldn't happen.");
    }

    private _switchToSpeedTestPhase(): void {
        const state = this._state;

        if (state.speedTestMode === 0) {
            state.speedTestMode = 1;
        } else {
            return;
        }

        state.fastestRecords.fill(0);
        state.speedTestMode++;
    }

    public inSpeedTestPhase(): boolean {
        return this._state.speedTestMode > 1;
    }

    public recordFastest(index: number, node: ServerNode): void {
        const state = this._state;
        const stateFastest = state.fastestRecords;

        // the following two checks are to verify that things didn't move
        // while we were computing the fastest node, we verify that the index
        // of the fastest node and the identity of the node didn't change during
        // our check
        if (index < 0 || index >= stateFastest.length) {
            return;
        }

        if (node !== state.nodes[index]) {
            return;
        }

        if (++stateFastest[index] >= 10) {
            this._selectFastest(state, index);
        }

        if (++state.speedTestMode <= state.nodes.length * 10) {
            return;
        }

        // too many concurrent speed tests are happening
        const maxIndex: number = NodeSelector._findMaxIndex(state);
        this._selectFastest(state, maxIndex);
    }

    private static _findMaxIndex(state: NodeSelectorState): number {
        const stateFastest = state.fastestRecords;
        let maxIndex = 0;
        let maxValue = 0;

        for (let i = 0; i < stateFastest.length; i++) {
            if (maxValue >= stateFastest[i]) {
                continue;
            }

            maxIndex = i;
            maxValue = stateFastest[i];
        }

        return maxIndex;
    }

    private _selectFastest(state: NodeSelectorState, index: number): void {
        state.fastest = index;
        state.speedTestMode = 0;

        this._ensureFastestNodeTimerExists();

        const minuteMs = moment.duration(1, "m").asMilliseconds();
        this._updateFastestNodeTimer.change(minuteMs, null);
    }

    public scheduleSpeedTest(): void {
        this._ensureFastestNodeTimerExists();
        this._switchToSpeedTestPhase();
    }

    private _ensureFastestNodeTimerExists() {
        if (!this._updateFastestNodeTimer) {
            this._updateFastestNodeTimer = new Timer(async () => this._switchToSpeedTestPhase(), null, null);
        }
    }
}
