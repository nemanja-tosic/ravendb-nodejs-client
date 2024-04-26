import { InMemoryDocumentSessionOperations } from "../InMemoryDocumentSessionOperations.js";
import { GetDocumentsCommand, GetDocumentsResult } from "../../Commands/GetDocumentsCommand.js";
import { StartingWithOptions } from "../IDocumentSession.js";
import { DocumentInfo } from "../DocumentInfo.js";
import { DocumentType } from "../../DocumentAbstractions.js";
import { TypeUtil } from "../../../Utility/TypeUtil.js";
import { throwError } from "../../../Exceptions/index.js";
import { ObjectTypeDescriptor } from "../../../Types/index.js";

export class LoadStartingWithOperation {

    public static DEFAULT: StartingWithOptions = {
        start: 0,
        pageSize: 25,
        exclude: "",
        startAfter: "",
        matches: ""
    };

    private _session: InMemoryDocumentSessionOperations;

    private _startWith: string;
    private _matches: string;
    private _start: number;
    private _pageSize: number;
    private _exclude: string;
    private _startAfter: string;

    private _returnedIds: string[] = [];
    private _resultsSet: boolean;
    private _results: GetDocumentsResult;

    public constructor(session: InMemoryDocumentSessionOperations) {
        this._session = session;
    }

    public createRequest(): GetDocumentsCommand {
        this._session.incrementRequestCount();

        return new GetDocumentsCommand({
            startsWith: this._startWith,
            startsAfter: this._startAfter,
            matches: this._matches,
            exclude: this._exclude,
            start: this._start,
            pageSize: this._pageSize,
            metadataOnly: false,
            conventions: this._session.conventions
        });
    }

    public withStartWith(idPrefix: string, opts: StartingWithOptions): void {
        const optsToUse: StartingWithOptions = Object.keys(LoadStartingWithOperation.DEFAULT)
            .reduce((result, next) => {
                result[next] = TypeUtil.isNullOrUndefined(opts[next])
                    ? LoadStartingWithOperation.DEFAULT[next]
                    : opts[next];
                return result;
            }, {});

        this._startWith = idPrefix;
        this._matches = optsToUse.matches;
        this._start = optsToUse.start;
        this._pageSize = optsToUse.pageSize;
        this._exclude = optsToUse.exclude;
        this._startAfter = optsToUse.startAfter;
    }

    public setResult(result: GetDocumentsResult): void {
        this._resultsSet = true;

        if (this._session.noTracking) {
            this._results = result;
            return;
        }

        for (const document of result.results) {
            if (!document) {
                continue;
            }
            const newDocumentInfo = DocumentInfo.getNewDocumentInfo(document);
            this._session.documentsById.add(newDocumentInfo);
            this._returnedIds.push(newDocumentInfo.id);
        }
    }

    public getDocuments<T extends object>(docType: DocumentType<T>): T[] {
        const entityType = this._session.conventions.getJsTypeByDocumentType<T>(docType);

        if (this._session.noTracking) {
            if (!this._results) {
                throwError(
                    "InvalidOperationException", "Cannot execute getDocuments before operation execution.");
            }

            if (!this._results || !this._results.results || !this._results.results.length) {
                return [];
            }
            
            return this._results.results
                .map(doc => {
                    const newDocumentInfo = DocumentInfo.getNewDocumentInfo(doc);
                    return this._session.trackEntity(entityType, newDocumentInfo);
                });
        }

        return this._returnedIds.map(id => {
            return this._getDocument(entityType, id);
        });
    }

    private _getDocument<T extends object>(entityType: ObjectTypeDescriptor<T>, id: string): T | null {
        if (!id) {
            return null;
        }

        if (this._session.isDeleted(id)) {
            return null;
        }

        const doc = this._session.documentsById.getValue(id);
        if (doc) {
            return this._session.trackEntity<T>(entityType, doc);
        }

        return null;
    }
}
