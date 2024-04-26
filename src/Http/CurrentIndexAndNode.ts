import { ServerNode } from "./ServerNode.js";

export default class CurrentIndexAndNode {
    public currentIndex: number;
    public currentNode: ServerNode;

    constructor(currentIndex: number, currentNode: ServerNode) {
        this.currentIndex = currentIndex;
        this.currentNode = currentNode;
    }
}
