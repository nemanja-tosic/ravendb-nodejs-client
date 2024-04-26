import { AbstractIndexDefinitionBuilder } from "../AbstractIndexDefinitionBuilder.js";
import { TimeSeriesIndexDefinition } from "./TimeSeriesIndexDefinition.js";
import { throwError } from "../../../Exceptions/index.js";
import { DocumentConventions } from "../../Conventions/DocumentConventions.js";

export class TimeSeriesIndexDefinitionBuilder extends AbstractIndexDefinitionBuilder<TimeSeriesIndexDefinition> {
    public map: string;

    public constructor(indexName?: string) {
        super(indexName);
    }

    protected _newIndexDefinition(): TimeSeriesIndexDefinition {
        return new TimeSeriesIndexDefinition();
    }

    toIndexDefinition(conventions: DocumentConventions, validateMap: boolean = true): TimeSeriesIndexDefinition {
        if (!this.map && validateMap) {
            throwError("InvalidArgumentException",
                "Map is required to generate an index, you cannot create an index without a valid Map property (in index " + this._indexName + ").");
        }
        return super.toIndexDefinition(conventions, validateMap);
    }

    protected _toIndexDefinition(indexDefinition: TimeSeriesIndexDefinition, conventions: DocumentConventions) {
        if (!this.map) {
            return;
        }

        indexDefinition.maps.add(this.map);
    }
}
