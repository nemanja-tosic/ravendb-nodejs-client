import { QueryToken } from "./QueryToken.js";
import { SpatialUnits } from "../../Indexes/Spatial.js";

export class ShapeToken extends QueryToken {

    private readonly _shape: string;

    private constructor(shape: string) {
        super();
        this._shape = shape;
    }

    public static circle(
        radiusParameterName: string,
        latitudeParameterName: string,
        longitudeParameterName: string,
        radiusUnits: SpatialUnits): ShapeToken {
        if (!radiusUnits) {
            return new ShapeToken(
                "spatial.circle($"
                + radiusParameterName
                + ", $" + latitudeParameterName
                + ", $" + longitudeParameterName + ")");
        }

        if (radiusUnits === "Kilometers") {
            return new ShapeToken(
                "spatial.circle($" + radiusParameterName
                + ", $" + latitudeParameterName
                + ", $" + longitudeParameterName
                + ", 'Kilometers')");
        }

        return new ShapeToken(
            "spatial.circle($"
            + radiusParameterName
            + ", $" + latitudeParameterName
            + ", $" + longitudeParameterName
            + ", 'Miles')");
    }

    public static wkt(shapeWktParameterName: string, units: SpatialUnits): ShapeToken {
        if (!units) {
            return new ShapeToken("spatial.wkt($" + shapeWktParameterName + ")");
        }

        if (units === "Kilometers") {
            return new ShapeToken("spatial.wkt($" + shapeWktParameterName + ", 'Kilometers')");
        }

        return new ShapeToken("spatial.wkt($" + shapeWktParameterName + ", 'Miles')");
    }

    public writeTo(writer): void {
        writer.append(this._shape);
    }
}
