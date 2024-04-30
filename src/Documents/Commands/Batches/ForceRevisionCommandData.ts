import { CommandType, ICommandData } from "../CommandData.js";
import { throwError } from "../../../Exceptions/index.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";

export class ForceRevisionCommandData implements ICommandData {
    public id: string;
    public name: string;
    public changeVector: string;
    public type: CommandType = "ForceRevisionCreation";

    public constructor(id: string) {
        if (!id) {
            throwError("InvalidArgumentException", "Id cannot be null");
        }

        this.id = id;
    }

    public serialize(conventions: DocumentConventions): object {
        return {
            Id: this.id,
            Type: this.type
        }
    }
}
