import { Stream, Readable } from "node:stream";
import { HttpResponse } from "../../Primitives/Http";
import { closeHttpResponse } from "../../Utility/HttpUtil";
import { CapitalizeType } from "../../Types";

export type AttachmentType = "Document" | "Revision";

export interface AttachmentName {
    name: string;
    hash: string;
    contentType: string;
    size: number;
}

export interface IAttachmentObject extends CapitalizeType<AttachmentName> {
    getContentAsString(): string;
    getContentAsString(encoding: string): string;
    getContentAsStream(): any;
}

export interface AttachmentDetails extends AttachmentName {
    changeVector: string;
    documentId?: string;
}

export class AttachmentResult {

    constructor(
        public data: Readable,
        public details: AttachmentDetails,
        private _response: HttpResponse) {
    }

    public dispose() {
        return closeHttpResponse(this._response);
    }
}

export type AttachmentData = Readable | Buffer;
