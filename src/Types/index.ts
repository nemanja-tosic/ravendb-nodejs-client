import { SuggestionResult } from "../Documents/Queries/Suggestions/SuggestionResult";

export interface EntitiesCollectionObject<TEntity> extends IRavenObject<TEntity | null> {
    [id: string]: TEntity | null;
}

export interface RevisionsCollectionObject<TEntity> extends IRavenObject<TEntity | null> {
    [changeVector: string]: TEntity | null;
}

export interface SuggestionsResponseObject {
    [fieldName: string]: SuggestionResult;
}

export interface IRavenObject<T = any> {
    [property: string]: T;
}

export interface IRavenArrayResult {
    results: any[];
}

export type CompareExchangeResultClass<T> = T extends object ? EntityConstructor<T> : unknown;

export interface ClassConstructor<T extends object = object> {
    name: string;

    new(...args: any[]): any;
}

export interface EntityConstructor<T extends object = object> {
    new(...args: any): T;

    name: string;
}

export type ObjectTypeDescriptor<T extends object = object> = EntityConstructor<T> | ObjectLiteralDescriptor<T>;

export abstract class EntityObjectLiteralDescriptor<T extends object> implements ObjectLiteralDescriptor {
    public abstract name: string;

    public abstract isType(obj: object);

    public abstract construct(dto: object): T;
}

export interface ObjectLiteralDescriptor<TResult extends object = object> {
    name: string;

    isType(obj: object): boolean;

    construct(dto: object): TResult;
}

export abstract class PropsBasedObjectLiteralDescriptor<T extends object>
    implements EntityObjectLiteralDescriptor<T> {
    // if it quacks like a duck...

    public abstract name: string;
    public abstract properties: string[];

    public abstract construct(dto: object): T;

    public isType(obj: object) {
        return this._hasProperties(obj);
    }

    private _hasProperties(obj: object): boolean {
        return this.properties.reduce((result, property) => {
            // eslint-disable-next-line no-prototype-builtins
            return result && obj.hasOwnProperty(property);
        }, true);
    }
}

export type CapitalizeType<T> = { [K in keyof T & string as `${Capitalize<K>}`]: T[K] };

export type Field<T> = keyof T & string | string;

export type ServerResponse<T> = T extends Date|string ? T : {
    [K in keyof T]: T[K] extends Date
        ? string
        : ServerResponse<T[K]>;
}

export type CapitalizeObjectKeys<T> = T extends Array<infer U>
    ? Array<CapitalizeObjectKeys<U>>
    : T extends object
        ? {
            [K in keyof T as Capitalize<string & K>]: CapitalizeObjectKeys<T[K]>
        }
        : T

export type ServerCasing<T extends object> = CapitalizeObjectKeys<T>;
