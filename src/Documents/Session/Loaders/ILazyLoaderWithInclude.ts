import { ObjectTypeDescriptor, EntitiesCollectionObject } from "../../../Types/index.js";
import { Lazy } from "../../Lazy.js";

export interface ILazyLoaderWithInclude {
    //TBD expr overrides with expressions + maybe we TInclude, see:

    /**
     * Begin a load while including the specified path
     */
    include(path: string): ILazyLoaderWithInclude;

    /**
     * Loads the specified ids.
     */
    load<TResult extends object>(
        ids: string[]): Lazy<EntitiesCollectionObject<TResult>>;

    /**
     * Loads the specified ids.
     */
    load<TResult extends object>(
        ids: string[], clazz: ObjectTypeDescriptor<TResult>): Lazy<EntitiesCollectionObject<TResult>>;

    /**
     * Loads the specified entity with the specified id.
     */
    load<TResult extends object>(
        id: string, clazz?: ObjectTypeDescriptor<TResult>): Lazy<TResult | null>;

    /**
     * Loads the specified entity with the specified id.
     */
    load<TResult extends object>(
        id: string): Lazy<TResult | null>;
}
