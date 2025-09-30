declare module "togpx" {
  import type { FeatureCollection, Geometry } from "geojson";

  type GeoJsonInput = FeatureCollection<Geometry>;

  type TogpxMetadata = {
    name?: string;
    desc?: string;
  };

  type TogpxOptions = {
    creator?: string;
    metadata?: TogpxMetadata;
  };

  export default function togpx(input: GeoJsonInput, options?: TogpxOptions): string;
}
