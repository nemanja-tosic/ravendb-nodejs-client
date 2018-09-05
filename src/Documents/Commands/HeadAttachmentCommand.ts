import { RavenCommand } from "./../../Http/RavenCommand";
import { StringUtil } from "../../Utility/StringUtil";

export class HeadAttachmentCommand extends RavenCommand<String> {

    private readonly _documentId: string;
    private readonly _name: string;
    private readonly _changeVector: string;

   public constructor(documentId: String, name: String, changeVector: String) {
       super();

       if (StringUtil.isWhitespace(documentId)) {
           throwError("InvalidArgumentException", "DocumentId cannot be null or empty");
       }

       if (StringUtil.isWhitespace(name)) {
           throw new IllegalArgumentException("Name cannot be null or empty");
       }

       this._documentId = documentId;
       this._name = name;
       this._changeVector = changeVector;
   }
    @Override
   public HttpRequestBase createRequest(ServerNode node, Reference<String> url) {
       url.value = node.getUrl()
               + "/databases/" + node.getDatabase()
               + "/attachments?id=" + UrlUtils.escapeDataString(_documentId)
               + "&name=" + UrlUtils.escapeDataString(_name);
        HttpHead httpHead = new HttpHead();
        if (_changeVector != null) {
           httpHead.addHeader("If-None-Match", _changeVector);
       }
        return httpHead;
   }
    @Override
   public ResponseDisposeHandling processResponse(HttpCache cache, CloseableHttpResponse response, String url) {
       if (response.getStatusLine().getStatusCode() == HttpStatus.SC_NOT_MODIFIED) {
           result = _changeVector;
           return ResponseDisposeHandling.AUTOMATIC;
       }
        if (response.getStatusLine().getStatusCode() == HttpStatus.SC_NOT_FOUND) {
           result = null;
           return ResponseDisposeHandling.AUTOMATIC;
       }
        result = HttpExtensions.getRequiredEtagHeader(response);
       return ResponseDisposeHandling.AUTOMATIC;
   }
    @Override
   public void setResponse(String response, boolean fromCache) throws IOException {
       if (response != null) {
           throwInvalidResponse();
       }
        result = null;
   }
    @Override
   public boolean isReadRequest() {
       return false;
   }
}