import { ICommandData, CommandType } from "../CommandData";
import { AttachmentData } from "../../Attachments";
import { StringUtil } from "../../../Utility/StringUtil";
import { throwError } from "../../../Exceptions";
import { DocumentConventions } from "../../Conventions/DocumentConventions";

export class PutAttachmentCommandData implements ICommandData {
    public id: string;
    public name: string;
    public changeVector: string;
    public type: CommandType = "AttachmentPUT";
    public contentType: string;
    public attStream: AttachmentData;

    public constructor(
        documentId: string,
        name: string,
        stream: AttachmentData,
        contentType: string,
        changeVector: string) {

        if (StringUtil.isNullOrWhitespace(documentId)) {
            throwError("InvalidArgumentException", "DocumentId cannot be null.");
        }

        if (StringUtil.isNullOrWhitespace(name)) {
            throwError("InvalidArgumentException", "Name cannot be null.");
        }

        this.id = documentId;
        this.name = name;
        this.attStream = stream;
        this.contentType = contentType;
        this.changeVector = changeVector;
    }

    public serialize(conventions: DocumentConventions): object {
        return {
            Id: this.id,
            Name: this.name,
            ChangeVector: this.changeVector,
            Type: "AttachmentPUT" as CommandType,
            ContentType: this.contentType
        };
    }
}
