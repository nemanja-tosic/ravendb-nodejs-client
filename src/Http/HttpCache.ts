import * as moment from "moment";
import * as Cache from "safe-memory-cache/map";
import { IDisposable } from "../Types/Contracts";

export interface CachedItemMetadata {
    changeVector: string;
    response: string;
}
export class HttpCache implements IDisposable {
    
    private _items: Cache;

    public generation = 0;

    constructor(maxKeysSize: number = 500) {
        this._items = new Cache({
            limit: maxKeysSize
        });
    }

    public dispose(): void {
        this._items.clear();
        this._items = null;
    }

    public set(url: string, changeVector: string, result: string) {
        const httpCacheItem = new HttpCacheItem();
        httpCacheItem.changeVector = changeVector;
        httpCacheItem.payload = result;
        httpCacheItem.cache = this;
        httpCacheItem.generation = this.generation;

        this._items.set(url, httpCacheItem);
    } 

    public get<TResult>(
        url: string, 
        itemInfoCallback?: ({ changeVector, response }: CachedItemMetadata) => void): ReleaseCacheItem {
        const item: HttpCacheItem = this._items.get(url);
        if (item) {
            if (itemInfoCallback) {
                itemInfoCallback({
                    changeVector: item.changeVector,
                    response: item.payload
                });
            }

            return new ReleaseCacheItem(item);
        }

        if (itemInfoCallback) {
            itemInfoCallback({
                changeVector: null,
                response: null
            });
        }

        return new ReleaseCacheItem(null);
    }

    public setNotFound(url: string) {
        const httpCacheItem = new HttpCacheItem();
        httpCacheItem.changeVector = "404 response";
        httpCacheItem.cache = this;
        httpCacheItem.generation = this.generation;

        this._items.set(url, httpCacheItem);
    }

    public get numberOfItems(): number {
        return this._items["_get_buckets"]().reduce((result, next: Map<string, string>) => {
            return result + next.size;
        }, 0);
    }
}

export class ReleaseCacheItem {
    public item: HttpCacheItem;

    constructor(item: HttpCacheItem) {
        this.item = item;
    }

    public notModified(): void {
        if (this.item) {
            this.item.lastServerUpdate = moment().toDate();
        }
    }

    // returns millis
    public get age(): number {
        if (!this.item) {
            return Number.MAX_VALUE; 
        }

        return new Date().valueOf() - this.item.lastServerUpdate.valueOf();
    }

    public get mightHaveBeenModified() {
        return this.item.generation !== this.item.cache.generation;
    }
}

export class HttpCacheItem {
    public changeVector: string;
    public payload: string;
    public lastServerUpdate: Date;
    public generation: number;

    public cache: HttpCache;

    public constructor() {
        this.lastServerUpdate = moment().toDate();
    }
}