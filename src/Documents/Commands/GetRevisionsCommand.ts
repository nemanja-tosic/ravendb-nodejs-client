import { TypeUtil } from "../../Utility/TypeUtil.js";
import { HttpRequestParameters } from "../../Primitives/Http.js";
import { DateUtil } from "../../Utility/DateUtil.js";
import { Stream } from "node:stream";
import { GetDocumentsCommand } from "./GetDocumentsCommand.js";
import { RavenCommand } from "../../Http/RavenCommand.js";
import { IRavenArrayResult } from "../../Types/index.js";
import { DocumentConventions } from "../Conventions/DocumentConventions.js";
import { ServerNode } from "../../Http/ServerNode.js";
import { throwError } from "../../Exceptions/index.js";

export class GetRevisionsCommand extends RavenCommand<IRavenArrayResult> {

    private readonly _id: string;
    private readonly _start: number;
    private readonly _pageSize: number;
    private readonly _metadataOnly: boolean;
    private readonly _before: Date;
    private readonly _changeVector: string;
    private readonly _changeVectors: string[];
    private readonly _conventions: DocumentConventions;

    public constructor(conventions: DocumentConventions, changeVector: string);
    public constructor(conventions: DocumentConventions, changeVector: string, metadataOnly: boolean);
    public constructor(conventions: DocumentConventions, changeVectors: string[]);
    public constructor(conventions: DocumentConventions, changeVectors: string[], metadataOnly: boolean);
    public constructor(conventions: DocumentConventions, id: string, before: Date);
    public constructor(conventions: DocumentConventions, id: string, start: number,
                       pageSize: number);
    public constructor(conventions: DocumentConventions, id: string, start: number, pageSize: number,
                       metadataOnly: boolean);
    public constructor(conventions: DocumentConventions, changeVectorOrVectorsOrId: string | string[],
                       beforeOrMetadataOrStart?: boolean | Date | number,
                       pageSize?: number, metadataOnly?: boolean) {
        super();

        if (beforeOrMetadataOrStart instanceof Date) {
            if (!changeVectorOrVectorsOrId) {
                throwError("InvalidArgumentException", "Id cannot be null.");
            }
            this._id = changeVectorOrVectorsOrId as string;
            this._before = beforeOrMetadataOrStart;
        } else if (TypeUtil.isArray(changeVectorOrVectorsOrId)) {
            this._changeVectors = changeVectorOrVectorsOrId;
            this._metadataOnly = metadataOnly || false;
        } else if (TypeUtil.isNumber(beforeOrMetadataOrStart)) {
            if (!changeVectorOrVectorsOrId) {
                throwError("InvalidArgumentException", "Id cannot be null.");
            }
            this._id = changeVectorOrVectorsOrId;
            this._start = beforeOrMetadataOrStart;
            this._pageSize = pageSize;
            this._metadataOnly = metadataOnly || false;
        } else {
            this._changeVector = changeVectorOrVectorsOrId;
            this._metadataOnly = beforeOrMetadataOrStart || false;
        }

        this._conventions = conventions;
    }

    public get id(): string {
        return this._id;
    }

    public get before(): Date {
        return this._before;
    }

    public get changeVector(): string {
        return this._changeVector;
    }

    public get changeVectors() {
        return this._changeVectors;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        let uri = node.url + "/databases/" + node.database + "/revisions?";

        uri += this.getRequestQueryString();

        return {
            uri,
            method: "GET"
        };
    }

    public getRequestQueryString(): string {
        let uri = "";
        if (this._id) {
            uri += "&id=" + encodeURIComponent(this._id);
        } else if (this._changeVector) {
            uri += "&changeVector=" + encodeURIComponent(this._changeVector);
        } else if (this._changeVectors) {
            for (const changeVector of this._changeVectors) {
                uri += "&changeVector=" + encodeURIComponent(changeVector);
            }
        }

        if (this._before) {
            uri += "&before=" + DateUtil.utc.stringify(this._before);
        }

        if (!TypeUtil.isNullOrUndefined(this._start)) {
            uri += "&start=" + this._start;
        }

        if (!TypeUtil.isNullOrUndefined(this._pageSize)) {
            uri += "&pageSize=" + this._pageSize;
        }

        if (this._metadataOnly) {
            uri += "&metadataOnly=true";
        }

        return uri;
    }

    public get isReadRequest(): boolean {
        return true;
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            this.result = null;
            return;
        }

        let body: string = null;
        this.result =
            await GetDocumentsCommand.parseDocumentsResultResponseAsync(
                bodyStream, this._conventions, b => body = b);

        return body as string;
    }
}
