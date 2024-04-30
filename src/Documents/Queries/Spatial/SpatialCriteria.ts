import { ShapeToken } from "../../Session/Tokens/ShapeToken.js";
import { SpatialRelation } from "../../Indexes/Spatial.js";
import { QueryToken } from "../../Session/Tokens/QueryToken.js";
import { throwError } from "../../../Exceptions/index.js";
import { WhereOperator } from "../../Session/Tokens/WhereOperator.js";
import { WhereToken, WhereOptions } from "../../Session/Tokens/WhereToken.js";

export abstract class SpatialCriteria {

    private readonly _relation: SpatialRelation;
    private readonly _distanceErrorPct: number;

    protected constructor(relation: SpatialRelation, distanceErrorPct: number) {
        this._relation = relation;
        this._distanceErrorPct = distanceErrorPct;
    }

    protected abstract _getShapeToken(addQueryParameter: (o: object) => string): ShapeToken;

    public toQueryToken(fieldName: string, addQueryParameter: (o: object) => string): QueryToken {
        const shapeToken = this._getShapeToken(addQueryParameter);

        let whereOperator: WhereOperator;

        switch (this._relation) {
            case "Within": {
                whereOperator = "SpatialWithin";
                break;
            }
            case "Contains": {
                whereOperator = "SpatialContains";
                break;
            }
            case "Disjoint": {
                whereOperator = "SpatialDisjoint";
                break;
            }
            case "Intersects": {
                whereOperator = "SpatialIntersects";
                break;
            }
            default: {
                throwError("InvalidArgumentException");
            }
        }

        return WhereToken.create(whereOperator, fieldName, null, new WhereOptions({
            shape: shapeToken,
            distance: this._distanceErrorPct
        }));

    }
}
