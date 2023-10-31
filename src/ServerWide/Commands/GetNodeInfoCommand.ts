/* TODO

+public class GetNodeInfoCommand extends RavenCommand<NodeInfo> {
+
+    public GetNodeInfoCommand() {
+        super(NodeInfo.class);
+    }
+
+    @Override
+    public HttpRequestBase createRequest(ServerNode node, Reference<String> url) {
+        url.value = node.getUrl() + "/cluster/node-info";
+
+        return new HttpGet();
+    }
+
+    @Override
+    public void setResponse(String response, boolean fromCache) throws IOException {
+        if (response == null) {
+            return;
+        }
+
+        result = mapper.readValue(response, NodeInfo.class);
+    }
+
+    @Override
+    public boolean isReadRequest() {
+        return true;
+    }
+}
 */
