declare module "tokml" {
  import type { Feature, FeatureCollection, Geometry } from "geojson";

  type GeoJsonInput = FeatureCollection<Geometry> | Feature<Geometry>;

  type TokmlOptions = {
    name?: string;
    description?: string;
    simplestyle?: boolean;
  };

  export default function tokml(input: GeoJsonInput, options?: TokmlOptions): string;
}
