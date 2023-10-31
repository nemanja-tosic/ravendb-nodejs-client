/* TODO

+public class DelayBackupOperation implements IVoidMaintenanceOperation {
+
+    private final long _runningBackupTaskId;
+    private final Duration _duration;
+
+    public DelayBackupOperation(long runningBackupTaskId, Duration duration) {
+        _runningBackupTaskId = runningBackupTaskId;
+        _duration = duration;
+    }
+
+    @Override
+    public VoidRavenCommand getCommand(DocumentConventions conventions) {
+        return new DelayBackupCommand(_runningBackupTaskId, _duration);
+    }
+
+    private static class DelayBackupCommand extends VoidRavenCommand {
+        private final long _taskId;
+        private final Duration _duration;
+
+        public DelayBackupCommand(long taskId, Duration duration) {
+            _taskId = taskId;
+            _duration = duration;
+        }
+
+        @Override
+        public boolean isReadRequest() {
+            return true;
+        }
+
+
+        @Override
+        public HttpRequestBase createRequest(ServerNode node, Reference<String> url) {
+            url.value = node.getUrl() + "/admin/backup-task/delay?taskId=" + _taskId + "&duration=" + TimeUtils.durationToTimeSpan(_duration) + "&database=" + node.getDatabase();
+
+            return new HttpPost();
+        }
+    }
+}
 */
