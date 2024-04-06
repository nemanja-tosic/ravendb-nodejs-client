import { HttpRequestParameters } from "../../../Primitives/Http";
import { IOperation, OperationResultType } from "../OperationAbstractions";
import { CompareExchangeValue } from "./CompareExchangeValue";
import { RavenCommand } from "../../../Http/RavenCommand";
import { HttpCache } from "../../../Http/HttpCache";
import { DocumentConventions } from "../../Conventions/DocumentConventions";
import { IDocumentStore } from "../../IDocumentStore";
import { throwError } from "../../../Exceptions";
import { ServerNode } from "../../../Http/ServerNode";
import { CompareExchangeResultClass, ServerCasing, ServerResponse } from "../../../Types";
import { CompareExchangeValueResultParser, GetCompareExchangeValuesResponse } from "./CompareExchangeValueResultParser";
import { Stream } from "node:stream";
import { GetCompareExchangeValuesCommand } from "./GetCompareExchangeValuesOperation";

export class GetCompareExchangeValueOperation<T> implements IOperation<CompareExchangeValue<T>> {

    private readonly _key: string;
    private readonly _materializeMetadata: boolean;
    private readonly _clazz: CompareExchangeResultClass<T>;

    public constructor(key: string, clazz?: CompareExchangeResultClass<T>, materializeMetadata: boolean = true) {
        this._key = key;
        this._clazz = clazz;
        this._materializeMetadata = materializeMetadata;
    }

    public getCommand(
        store: IDocumentStore,
        conventions: DocumentConventions,
        cache: HttpCache): RavenCommand<CompareExchangeValue<T>> {
        return new GetCompareExchangeValueCommand<T>(this._key, this._materializeMetadata, conventions, this._clazz);
    }

    public get resultType(): OperationResultType {
        return "CommandResult";
    }
}

export class GetCompareExchangeValueCommand<T> extends RavenCommand<CompareExchangeValue<T>> {
    private readonly _key: string;
    private readonly _clazz: CompareExchangeResultClass<T>;
    private readonly _materializeMetadata: boolean;
    private readonly _conventions: DocumentConventions;

    public constructor(key: string, materializeMetadata: boolean, conventions: DocumentConventions, clazz?: CompareExchangeResultClass<T>) {
        super();

        if (!key) {
            throwError("InvalidArgumentException", "The key argument must have value");
        }

        this._key = key;
        this._clazz = clazz;
        this._materializeMetadata = materializeMetadata;
        this._conventions = conventions;
    }

    public get isReadRequest(): boolean {
        return true;
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/cmpxchg?key=" + encodeURIComponent(this._key);
        return {uri};
    }

    public async setResponseAsync(bodyStream: Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            return null;
        }

        let body: string = null;
        const results = await this._pipeline<ServerCasing<ServerResponse<GetCompareExchangeValuesResponse>>>()
            .collectBody(x => body = x)
            .parseJsonSync()
            .process(bodyStream);

        const localObject = GetCompareExchangeValuesCommand.mapToLocalObject(results);

        this.result = CompareExchangeValueResultParser.getValue(localObject, this._materializeMetadata, this._conventions, this._clazz);
        return body;
    }
}
