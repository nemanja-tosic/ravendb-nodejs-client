import { DocumentSessionAttachmentsBase } from "./DocumentSessionAttachmentsBase.js";
import { IAttachmentsSessionOperations } from "./IAttachmentsSessionOperations.js";
import { InMemoryDocumentSessionOperations } from "./InMemoryDocumentSessionOperations.js";
import { HeadAttachmentCommand } from "../Commands/HeadAttachmentCommand.js";
import { AttachmentResult } from "../Attachments/index.js";
import { GetAttachmentOperation } from "../Operations/Attachments/GetAttachmentOperation.js";

export class DocumentSessionAttachments
    extends DocumentSessionAttachmentsBase implements IAttachmentsSessionOperations {

    public constructor(session: InMemoryDocumentSessionOperations) {
        super(session);
    }

    public async exists(documentId: string, name: string): Promise<boolean> {
        const command = new HeadAttachmentCommand(documentId, name, null);
        this._session.incrementRequestCount();
        await this._requestExecutor.execute(command, this._sessionInfo);
        return !!command.result;
    }

    public async get(entity: object, name: string): Promise<AttachmentResult>;
    public async get(documentId: string, name: string): Promise<AttachmentResult>;
    public async get(
        idOrEntity: string | object,
        name: string): Promise<AttachmentResult> {
        let docId;
        if (typeof idOrEntity !== "string") {
            const document = this._session.documentsByEntity.get(idOrEntity);
            if (!document) {
                this._throwEntityNotInSessionOrMissingId(idOrEntity);
            }

            docId = document.id;
        } else {
            docId = idOrEntity;
        }

        const operation: GetAttachmentOperation =
            new GetAttachmentOperation(docId, name, "Document", null);
        this._session.incrementRequestCount();
        return await this._session.operations.send(operation, this._sessionInfo);
    }

    public async getRevision(documentId: string, name: string, changeVector: string): Promise<AttachmentResult> {
        const operation = new GetAttachmentOperation(documentId, name, "Revision", changeVector);
        this._session.incrementRequestCount();
        return this._session.operations.send(operation, this._sessionInfo);
    }
}
