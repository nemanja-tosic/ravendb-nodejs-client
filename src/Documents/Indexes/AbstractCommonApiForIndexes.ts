import { IndexConfiguration } from "./IndexDefinition.js";
import { AdditionalAssembly } from "./AdditionalAssembly.js";

export abstract class AbstractCommonApiForIndexes {
    additionalSources: Record<string, string>;
    additionalAssemblies: AdditionalAssembly[];
    configuration: IndexConfiguration;

    protected constructor() {
        this.configuration = {};
    }

    /**
     * Gets a value indicating whether this instance is map reduce index definition
     */
    public get isMapReduce(): boolean {
        return false;
    }

    /**
     * Generates index name from type name replacing all _ with /
     */
    public getIndexName() {
        return AbstractCommonApiForIndexes.getIndexNameForCtor(this.constructor.name);
    }

    public static getIndexNameForCtor(indexCtorName: string) {
        return indexCtorName.replace(/_/g, "/");
    }
}