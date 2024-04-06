import { InMemoryDocumentSessionOperations } from "./InMemoryDocumentSessionOperations";
import { IMetadataDictionary } from "./IMetadataDictionary";
import { IDocumentQueryCustomization } from "./IDocumentQueryCustomization";
import { DocumentType } from "../DocumentAbstractions";
import { Reference } from "../../Utility/Reference";
import { Topology } from "../../Http/Topology";
import { HttpRequestParameters, HttpResponse } from "../../Primitives/Http";
import { SessionDisposingEventArgs } from "../IDocumentStore";
import { BulkInsertProgress } from "../Operations/BulkInsertProgress";

export interface SessionEventsEmitter {
    on(eventName: "beforeStore", eventHandler: (eventArgs: SessionBeforeStoreEventArgs) => void): this;

    on(eventName: "afterSaveChanges", eventHandler: (eventArgs: SessionAfterSaveChangesEventArgs) => void): this;

    on(eventName: "beforeQuery", eventHandler: (eventArgs: SessionBeforeQueryEventArgs) => void): this;

    on(eventName: "beforeDelete", eventHandler: (eventArgs: SessionBeforeDeleteEventArgs) => void): this;

    on(eventName: "sessionDisposing", eventHandler: (eventArgs: SessionDisposingEventArgs) => void): this;

    on(eventName: "beforeConversionToDocument", eventHandler: (eventArgs: BeforeConversionToDocumentEventArgs) => void): this;
    on(eventName: "afterConversionToDocument", eventHandler: (eventArgs: AfterConversionToDocumentEventArgs) => void): this;
    on(eventName: "beforeConversionToEntity", eventHandler: (eventArgs: BeforeConversionToEntityEventArgs) => void): this;
    on(eventName: "afterConversionToEntity", eventHandler: (eventArgs: AfterConversionToEntityEventArgs) => void): this;


    removeListener(eventName: "beforeStore", eventHandler: (eventArgs: SessionBeforeStoreEventArgs) => void): this;

    removeListener(
        eventName: "afterSaveChanges", eventHandler: (eventArgs: SessionAfterSaveChangesEventArgs) => void): this;

    removeListener(eventName: "beforeQuery", eventHandler: (eventArgs: SessionBeforeQueryEventArgs) => void): this;

    removeListener(eventName: "beforeDelete", eventHandler: (eventArgs: SessionBeforeDeleteEventArgs) => void): this;

    removeListener(eventName: "sessionDisposing", eventHandler: (eventArgs: SessionDisposingEventArgs) => void): this;

    removeListener(eventName: "beforeConversionToDocument", eventHandler: (eventArgs: BeforeConversionToDocumentEventArgs) => void): this;
    removeListener(eventName: "afterConversionToDocument", eventHandler: (eventArgs: AfterConversionToDocumentEventArgs) => void): this;
    removeListener(eventName: "beforeConversionToEntity", eventHandler: (eventArgs: BeforeConversionToEntityEventArgs) => void): this;
    removeListener(eventName: "afterConversionToEntity", eventHandler: (eventArgs: AfterConversionToEntityEventArgs) => void): this;

    emit(eventName: "beforeStore", eventArgs: SessionBeforeStoreEventArgs): void;
    emit(eventName: "afterSaveChanges", eventArgs: SessionAfterSaveChangesEventArgs): void;
    emit(eventName: "beforeQuery", eventArgs: SessionBeforeQueryEventArgs): void;
    emit(eventName: "beforeDelete", eventArgs: SessionBeforeDeleteEventArgs): void;
    emit(eventName: "sessionDisposing", eventArgs: SessionDisposingEventArgs): void;

    emit(eventName: "beforeConversionToDocument", eventArgs: BeforeConversionToDocumentEventArgs): void;
    emit(eventName: "afterConversionToDocument", eventArgs: AfterConversionToDocumentEventArgs): void;
    emit(eventName: "beforeConversionToEntity", eventArgs: BeforeConversionToEntityEventArgs): void;
    emit(eventName: "afterConversionToEntity", eventArgs: AfterConversionToEntityEventArgs): void;
}

export class SessionBeforeStoreEventArgs {
    private _documentMetadata: IMetadataDictionary;

    private readonly _session: InMemoryDocumentSessionOperations;
    private readonly _documentId: string;
    private readonly _entity: object;

    public constructor(
        session: InMemoryDocumentSessionOperations, documentId: string, entity: object) {
        this._session = session;
        this._documentId = documentId;
        this._entity = entity;
    }

    public get session() {
        return this._session;
    }

    public get documentId() {
        return this._documentId;
    }

    public getEntity(): object {
        return this._entity;
    }

    public isMetadataAccessed(): boolean {
        return !!this._documentMetadata;
    }

    public getDocumentMetadata(): IMetadataDictionary {
        if (!this._documentMetadata) {
            this._documentMetadata = this._session.getMetadataFor(this._entity);
        }

        return this._documentMetadata;
    }
}

export class SessionBeforeQueryEventArgs {
    constructor(
        public session: InMemoryDocumentSessionOperations,
        public queryCustomization: IDocumentQueryCustomization) {
        // empty
    }
}

export class SessionBeforeDeleteEventArgs {

    private _documentMetadata: IMetadataDictionary;

    private readonly _session: InMemoryDocumentSessionOperations;
    private readonly _documentId: string;
    private readonly _entity: object;

    public constructor(session: InMemoryDocumentSessionOperations, documentId: string, entity: object) {
        this._session = session;
        this._documentId = documentId;
        this._entity = entity;
    }

    public get session(): InMemoryDocumentSessionOperations {
        return this._session;
    }

    public get documentId() {
        return this._documentId;
    }

    public get entity() {
        return this._entity;
    }

    public get documentMetadata(): IMetadataDictionary {
        if (!this._documentMetadata) {
            this._documentMetadata = this._session.getMetadataFor(this._entity);
        }

        return this._documentMetadata;
    }
}

export class SessionAfterSaveChangesEventArgs {

    private _documentMetadata: IMetadataDictionary;

    public session: InMemoryDocumentSessionOperations;
    public documentId: string;
    public entity: object;

    public constructor(session: InMemoryDocumentSessionOperations, documentId: string, entity: object) {
        this.session = session;
        this.documentId = documentId;
        this.entity = entity;
    }

    public get documentMetadata(): IMetadataDictionary {
        if (!this._documentMetadata) {
            this._documentMetadata = this.session.getMetadataFor(this.entity);
        }

        return this._documentMetadata;
    }
}

export class BulkInsertOnProgressEventArgs {
    public readonly progress: BulkInsertProgress;


    public constructor(progress: BulkInsertProgress) {
        this.progress = progress;
    }
}

export class AfterConversionToDocumentEventArgs {
    public id: string;
    public entity: object;
    public document: Reference<object>;
    public session: InMemoryDocumentSessionOperations;

    public constructor(session: InMemoryDocumentSessionOperations, id: string, entity: object, document: Reference<object>) {
        this.session = session;
        this.id = id;
        this.entity = entity;
        this.document = document;
    }
}

export class AfterConversionToEntityEventArgs {
    public id: string;
    public document: object;
    public entity: object;
    public session: InMemoryDocumentSessionOperations;

    public constructor(session: InMemoryDocumentSessionOperations, id: string, document: object, entity: object) {
        this.session = session;
        this.id = id;
        this.document = document;
        this.entity = entity;
    }
}

export class BeforeConversionToDocumentEventArgs {
    public id: string;
    public entity: object;
    public session: InMemoryDocumentSessionOperations;

    public constructor(session: InMemoryDocumentSessionOperations, id: string, entity: object) {
        this.session = session;
        this.id = id;
        this.entity = entity;
    }
}

export class BeforeConversionToEntityEventArgs {
    public id: string;
    public type: DocumentType;
    public document: object;
    public session: InMemoryDocumentSessionOperations;

    public constructor(session: InMemoryDocumentSessionOperations, id: string, type: DocumentType, document: object) {
        this.session = session;
        this.id = id;
        this.type = type;
        this.document = document;
    }
}

export class FailedRequestEventArgs {
    public database: string;
    public url: string;
    public error: Error;
    public request: HttpRequestParameters;
    public response: HttpResponse;

    public constructor(database: string, url: string, error: Error, request: HttpRequestParameters, response: HttpResponse) {
        this.database = database;
        this.url = url;
        this.error = error;
        this.request = request;
        this.response = response;
    }
}

export class TopologyUpdatedEventArgs {
    public topology: Topology;

    public constructor(topology: Topology) {
        this.topology = topology;
    }
}

export class BeforeRequestEventArgs {
    public database: string;
    public url: string;
    public request: HttpRequestParameters;
    public attemptNumber: number;

    public constructor(database: string, url: string, request: HttpRequestParameters, attemptNumber: number) {
        this.database = database;
        this.url = url;
        this.request = request;
        this.attemptNumber = attemptNumber;
    }
}

export class SucceedRequestEventArgs {
    public database: string;
    public url: string;
    public response: HttpResponse;
    public request: HttpRequestParameters;
    public attemptNumber: number;

    public constructor(database: string, url: string, response: HttpResponse, request: HttpRequestParameters, attemptNumber: number) {
        this.database = database;
        this.url = url;
        this.response = response;
        this.request = request;
        this.attemptNumber = attemptNumber;
    }
}
