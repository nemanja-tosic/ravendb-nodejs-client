import * as stream from "readable-stream";

export type AttachmentType = "Document" | "Revision";

export interface AttachmentName {
    name: string;
    hash: string;
    contentType: string;
    size: number;
}

export interface AttachmentDetails extends AttachmentName {
    changeVector: string;
    documentId: string;
}

export interface AttachmentResult {
    data: stream.Readable;
    details: AttachmentDetails;
}

export type AttachmentData = stream.Readable | Buffer;
