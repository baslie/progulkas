declare module "@mapbox/togeojson" {
  import type { FeatureCollection, Geometry } from "geojson";

  export function gpx(document: Document): FeatureCollection<Geometry>;
  export function kml(document: Document): FeatureCollection<Geometry>;
}
