import * as stream from "readable-stream";
import { PutAttachmentCommandData } from "./PutAttachmentCommandData";
import { PutAttachmentCommandHelper } from "./PutAttachmentCommandHelper";
import { IRavenArrayResult } from "../../../Types";
import { RavenCommand } from "../../../Http/RavenCommand";
import { IDisposable } from "../../../Types/Contracts";
import { ICommandData } from "../CommandData";
import { BatchOptions } from "./BatchOptions";
import { DocumentConventions } from "../../Conventions/DocumentConventions";
import { throwError } from "../../../Exceptions";
import { ServerNode } from "../../../Http/ServerNode";
import { HttpRequestParameters } from "../../../Primitives/Http";
import { HeadersBuilder } from "../../../Utility/HttpUtil";
import { JsonSerializer } from "../../../Mapping/Json/Serializer";
import { RavenCommandResponsePipeline } from "../../../Http/RavenCommandResponsePipeline";
import { AttachmentData } from "../../Attachments";

export class BatchCommand extends RavenCommand<IRavenArrayResult> implements IDisposable {

    private _commands: ICommandData[];
    private _attachmentStreams: Set<AttachmentData>;
    private _options: BatchOptions;

    public constructor(conventions: DocumentConventions, commands: ICommandData[]);
    public constructor(conventions: DocumentConventions, commands: ICommandData[], options: BatchOptions);
    public constructor(conventions: DocumentConventions, commands: ICommandData[], options: BatchOptions = null) {
        super();
        this._commands = commands;
        this._options = options;

        if (!conventions) {
            throwError("InvalidArgumentException", "conventions cannot be null");
        }

        if (!commands) {
            throwError("InvalidArgumentException", "commands cannot be null");
        }

        for (const command of this._commands) {
            if (command instanceof PutAttachmentCommandData) {
                const putAttachmentCommandData = command as PutAttachmentCommandData;
                if (!this._attachmentStreams) {
                    this._attachmentStreams = new Set();
                }

                const { attStream } = putAttachmentCommandData;
                if (this._attachmentStreams.has(attStream)) {
                    PutAttachmentCommandHelper.throwStreamAlready();
                } else {
                    this._attachmentStreams.add(attStream);
                }
            }
        }
    }

    public createRequest(node: ServerNode): HttpRequestParameters {
        const uri = node.url + "/databases/" + node.database + "/bulk_docs";
        const headers = HeadersBuilder.create().withContentTypeJson().build();

        const commandsArray = this._commands.reduce(
            (result, command) => [ ...result, command.serialize() ], []);

        // TODO conventions-based entity casing customizations
        const body = JsonSerializer.getDefault().serialize({ Commands: commandsArray });

        const queryString = this._appendOptions();
        const request: HttpRequestParameters = { 
            method: "POST", 
            uri: uri + queryString,
        };

        if (this._attachmentStreams && this._attachmentStreams.size > 0) {
            // TODO verify
            const attachments = [...this._attachmentStreams]
                .map(attStream => {
                    return { 
                        body: attStream,
                        headers: {
                            "Command-Type": "AttachmentStream"
                        }
                    };
                });
            request.multipart = [ { headers, body }, ...attachments ];
        } else {
            request.body = body;
            request.headers = headers;
        }

        return request;
        /* TBD: attachments

        if (_attachmentStreams != null && _attachmentStreams.Count > 0)
        {
            var multipartContent = new MultipartContent {request.Content};
            foreach (var stream in _attachmentStreams)
            {
                PutAttachmentCommandHelper.PrepareStream(stream);
                var streamContent = new AttachmentStreamContent(stream, CancellationToken);
                streamContent.Headers.TryAddWithoutValidation("Command-Type", "AttachmentStream");
                multipartContent.Add(streamContent);
            }
            request.Content = multipartContent;
        }
            */
    }

    public async setResponseAsync(bodyStream: stream.Stream, fromCache: boolean): Promise<string> {
        if (!bodyStream) {
            throwError("InvalidOperationException", 
                "Got null response from the server after doing a batch,"
                + " something is very wrong. Probably a garbled response.");
        }

        return RavenCommandResponsePipeline.create<IRavenArrayResult>()
            .collectBody()
            .parseJsonSync()
            .streamKeyCaseTransform({
                targetKeyCaseConvention: "camel",
                ignoreKeys: [ /^@/ ]
            })
            .process(bodyStream)
            .then(results => {
                this.result = results.result;
                return results.body;
            });
    }

    private _appendOptions(): string {
        if (!this._options) {
            return "";
        }

        let result = "?";

        if (this._options.waitForReplicas) {
            result += `&waitForReplicasTimeout=${this._options.waitForReplicasTimeout}`;

            if (this._options.throwOnTimeoutInWaitForReplicas) {
                result += "&throwOnTimeoutInWaitForReplicas=true";
            }

            result += "&numberOfReplicasToWaitFor=";
            result += this._options.majority ? "majority" : this._options.numberOfReplicasToWaitFor;
        }

        if (this._options.waitForIndexes) {
            result += "&waitForIndexesTimeout=";
            result += this._options.waitForIndexesTimeout;

            if (this._options.throwOnTimeoutInWaitForIndexes) {
                result += "&waitForIndexThrow=true";
            } else {
                result += "&waitForIndexThrow=false";
            }

            if (this._options.waitForSpecificIndexes 
                && this._options.waitForSpecificIndexes.length) {
                for (const specificIndex of this._options.waitForSpecificIndexes) {
                    result += "&waitForSpecificIndex=" + specificIndex;
                }
            }
        }
    }

    public get isReadRequest(): boolean {
        return false;
    }

    // tslint:disable-next-line:no-empty
    public dispose(): void { }

}
