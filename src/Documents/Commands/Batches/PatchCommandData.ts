import { CommandType, ICommandData } from "../CommandData.js";
import { PatchRequest } from "../../Operations/PatchRequest.js";
import { throwError } from "../../../Exceptions/index.js";
import { TypeUtil } from "../../../Utility/TypeUtil.js";
import { InMemoryDocumentSessionOperations } from "../../Session/InMemoryDocumentSessionOperations.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";

export class PatchCommandData implements ICommandData {
    public id: string;
    public name: string = null;
    public createIfMissing: any;
    public changeVector: string;
    public patch: PatchRequest;
    public patchIfMissing: PatchRequest;
    public type: CommandType = "PATCH";
    public returnDocument: boolean;

    constructor(id: string, changeVector: string, patch: PatchRequest, patchIfMissing?: PatchRequest) {
        if (!id) {
            throwError("InvalidArgumentException", "Id cannot be null");
        }

        if (!patch) {
            throwError("InvalidArgumentException", "Patch cannot be null");
        }

        this.id = id;
        this.patch = patch;
        this.changeVector = changeVector;
        this.patchIfMissing = patchIfMissing;
    }

    public serialize(conventions: DocumentConventions): object {
        const result = {
            Id: this.id,
            ChangeVector: this.changeVector,
            Type: "PATCH" as CommandType,
            Patch: this.patch.serialize(conventions),
            PatchIfMissing: this.patchIfMissing ? this.patchIfMissing.serialize(conventions) : undefined
        };

        if (!TypeUtil.isNullOrUndefined(this.createIfMissing)) {
            result["CreateIfMissing"] = this.createIfMissing;
        }

        if (!TypeUtil.isNullOrUndefined(this.returnDocument)) {
            result["ReturnDocument"] = this.returnDocument;
        }

        return result;
    }

    public onBeforeSaveChanges(session: InMemoryDocumentSessionOperations): void {
        this.returnDocument = session.isLoaded(this.id);
    }
}
