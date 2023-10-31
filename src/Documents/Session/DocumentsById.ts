import { DocumentInfo } from "./DocumentInfo";
import { CaseInsensitiveKeysMap } from "../../Primitives/CaseInsensitiveKeysMap";

export class DocumentsById {

    public _inner: Map<string, DocumentInfo>;

    public constructor() {
        this._inner = CaseInsensitiveKeysMap.create();
    }

    public getValue(id: string) {
        return this._inner.get(id);
    }

    public add(info: DocumentInfo): void {
        if (this._inner.has(info.id)) {
            return;
        }

        this._inner.set(info.id, info);
    }

    public remove(id: string): boolean {
        return this._inner.delete(id);
    }

    public clear(): void {
        this._inner.clear();
    }

    public getCount(): number {
        return this._inner.size;
    }

    public entries() {
        return this._inner.entries();
    }

    /* TODO
    public Map<String, EntityInfo> getTrackedEntities(InMemoryDocumentSessionOperations session) {
        Map<String, EntityInfo> result = new TreeMap<>(String::compareToIgnoreCase);

        for (Map.Entry<String, DocumentInfo> keyValue : _inner.entrySet()) {
            EntityInfo entityInfo = new EntityInfo();
            entityInfo.setId(keyValue.getKey());
            entityInfo.setEntity(keyValue.getValue().getEntity());
            entityInfo.setDeleted(session.isDeleted(keyValue.getKey()));
            result.put(keyValue.getKey(), entityInfo);
        }

        return result;
    }

     */
}


export class EntityInfo {
    id: string;
    entity: object;
    isDeleted: boolean;
}
