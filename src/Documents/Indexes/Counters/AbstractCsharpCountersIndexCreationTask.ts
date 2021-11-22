import { AbstractGenericCountersIndexCreationTask } from "./AbstractGenericCountersIndexCreationTask";
import { CountersIndexDefinition } from "./CountersIndexDefinition";
import { CountersIndexDefinitionBuilder } from "./CountersIndexDefinitionBuilder";
import { DocumentConventions } from "../../Conventions/DocumentConventions";

export abstract class AbstractCsharpCountersIndexCreationTask extends AbstractGenericCountersIndexCreationTask {
    public map: string;

    createIndexDefinition(): CountersIndexDefinition {
        if (!this.conventions) {
            this.conventions = new DocumentConventions();
        }

        const indexDefinitionBuilder = new CountersIndexDefinitionBuilder(this.getIndexName());
        indexDefinitionBuilder.indexesStrings = this._indexesStrings;
        indexDefinitionBuilder.analyzersStrings = this._analyzersStrings;
        indexDefinitionBuilder.map = this.map;
        indexDefinitionBuilder.reduce = this._reduce;
        indexDefinitionBuilder.storesStrings = this._storesStrings;
        indexDefinitionBuilder.suggestionsOptions = this._indexSuggestions;
        indexDefinitionBuilder.termVectorsStrings = this._termVectorsStrings;
        indexDefinitionBuilder.spatialIndexesStrings = this._spatialOptionsStrings;
        indexDefinitionBuilder.outputReduceToCollection = this._outputReduceToCollection;
        indexDefinitionBuilder.patternForOutputReduceToCollectionReferences = this._patternForOutputReduceToCollectionReferences;
        indexDefinitionBuilder.patternReferencesCollectionName = this._patternReferencesCollectionName;
        indexDefinitionBuilder.additionalSources = this.additionalSources;
        indexDefinitionBuilder.additionalAssemblies = this.additionalAssemblies;
        indexDefinitionBuilder.configuration = this.configuration;
        indexDefinitionBuilder.lockMode = this.lockMode;
        indexDefinitionBuilder.priority = this.priority;
        indexDefinitionBuilder.state = this.state;
        indexDefinitionBuilder.deploymentMode = this.deploymentMode;

        return indexDefinitionBuilder.toIndexDefinition(this.conventions);
    }
}
