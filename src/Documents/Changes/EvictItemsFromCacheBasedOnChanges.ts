import {IDisposable} from "../../Types/Contracts";
import {IObservable} from "./IChangesObservable";
import {DatabaseChange} from "./DatabaseChange";
import {IDatabaseChanges} from "./IDatabaseChanges";
import {DocumentStore, RequestExecutor} from "../..";

export class EvictItemsFromCacheBasedOnChanges implements IDisposable, IObservable<DatabaseChange> {
     // TODO: implements IObserver or IObservable?

    private readonly _databaseName: string;
    private readonly _changes: IDatabaseChanges;
    private readonly _documentsSubscription: IDisposable;
    private readonly _indexesSubscription: IDisposable;
    private _requestExecutor: RequestExecutor;

    public constructor(store: DocumentStore, databaseName: string) {
        this._databaseName = databaseName;
        this._changes = store.changes();
        this._requestExecutor = store.getRequestExecutor(databaseName);

        const docSub = this._changes.forAllDocuments();
        /* TODO
        _documentsSubscription = docSub.subscribe((IObserver<DocumentChange>)(IObserver<?>)this);
+        IChangesObservable<IndexChange> indexSub = _changes.forAllIndexes();
+        _indexesSubscription = indexSub.subscribe( (IObserver<IndexChange>)(IObserver<?>)this);
         */
    }

}
/* TODO
+    @Override
+    public void onNext(DatabaseChange value) {
+        if (value instanceof DocumentChange) {
+            DocumentChange documentChange = (DocumentChange) value;
+            if (documentChange.getType() == DocumentChangeTypes.PUT || documentChange.getType() == DocumentChangeTypes.DELETE) {
+                _requestExecutor.getCache().generation.incrementAndGet();
+            }
+        } else if (value instanceof IndexChange) {
+            IndexChange indexChange = (IndexChange) value;
+            if (indexChange.getType() == IndexChangeTypes.BATCH_COMPLETED || indexChange.getType() == IndexChangeTypes.INDEX_REMOVED) {
+                _requestExecutor.getCache().generation.incrementAndGet();
+            }
+        }
+    }
+
+    @Override
+    public void onError(Exception error) {
+    }
+
+    @Override
+    public void onCompleted() {
+    }
+
+    public void close() {
+        try (CleanCloseable changesScope = _changes) {
+            _documentsSubscription.close();
+            _indexesSubscription.close();
+        }
+    }
+}
 */