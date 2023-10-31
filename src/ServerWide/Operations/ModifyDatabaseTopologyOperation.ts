/* TODO

+public class ModifyDatabaseTopologyOperation implements IServerOperation<ModifyDatabaseTopologyResult> {
+    private final String _databaseName;
+    private final DatabaseTopology _databaseTopology;
+
+    public ModifyDatabaseTopologyOperation(String databaseName, DatabaseTopology databaseTopology) {
+        if (databaseTopology == null) {
+            throw new IllegalArgumentException("DatabaseTopology cannot be null");
+        }
+        _databaseTopology = databaseTopology;
+        _databaseName = databaseName;
+    }
+
+    @Override
+    public RavenCommand<ModifyDatabaseTopologyResult> getCommand(DocumentConventions conventions) {
+        return new ModifyDatabaseTopologyCommand(_databaseName, _databaseTopology);
+    }
+
+    private static class ModifyDatabaseTopologyCommand extends RavenCommand<ModifyDatabaseTopologyResult> implements IRaftCommand {
+        private final String _databaseName;
+        private final DatabaseTopology _databaseTopology;
+
+        public ModifyDatabaseTopologyCommand(String databaseName, DatabaseTopology databaseTopology) {
+            super(ModifyDatabaseTopologyResult.class);
+
+            if (databaseTopology == null) {
+                throw new IllegalArgumentException("DatabaseTopology cannot be null");
+            }
+            _databaseTopology = databaseTopology;
+            _databaseName = databaseName;
+        }
+
+        @Override
+        public HttpRequestBase createRequest(ServerNode node, Reference<String> url) {
+            url.value = node.getUrl() + "/admin/databases/topology/modify?name=" + _databaseName;
+
+            HttpPost request = new HttpPost();
+            request.setEntity(new ContentProviderHttpEntity(outputStream -> {
+                try (JsonGenerator generator = createSafeJsonGenerator(outputStream)) {
+                    generator.getCodec().writeValue(generator, _databaseTopology);
+                } catch (IOException e) {
+                    throw new RuntimeException(e);
+                }
+            }, ContentType.APPLICATION_JSON));
+
+            return request;
+        }
+
+        @Override
+        public void setResponse(String response, boolean fromCache) throws IOException {
+            if (response == null) {
+                throwInvalidResponse();
+            }
+
+            result = mapper.readValue(response, ModifyDatabaseTopologyResult.class);
+        }
+
+        @Override
+        public boolean isReadRequest() {
+            return false;
+        }
+
+        @Override
+        public String getRaftUniqueRequestId() {
+            return RaftIdGenerator.newId();
+        }
+    }
 */
