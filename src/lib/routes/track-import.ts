import { gpx, kml } from "@mapbox/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  LineString,
  MultiLineString,
} from "geojson";

import { computeMapData, extractTrackSegments } from "@/lib/routes/map";
import type { RoutePointOfInterest, RouteTrackGeoJson } from "@/lib/routes/types";

export type TrackConversionStats = {
  segmentCount: number;
  pointCount: number;
  lengthKm: number | null;
  bounds: ReturnType<typeof computeMapData>["bounds"];
};

export type TrackConversionResult = {
  track: RouteTrackGeoJson;
  stats: TrackConversionStats;
};

function parseXml(input: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(input, "text/xml");

  if (!document || !document.documentElement) {
    throw new Error("Не удалось разобрать XML-файл трека");
  }

  const errors = document.getElementsByTagName("parsererror");
  if (errors.length > 0) {
    throw new Error("Файл трека повреждён или содержит ошибки");
  }

  return document;
}

function toGeoJson(geometry: FeatureCollection<Geometry> | Geometry): FeatureCollection<Geometry> {
  if ("type" in geometry && geometry.type === "FeatureCollection") {
    return geometry;
  }

  if ("type" in geometry) {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: geometry as Geometry,
        },
      ],
    };
  }

  throw new Error("Некорректный GeoJSON");
}

function isLineStringGeometry(geometry: Geometry): geometry is LineString | MultiLineString {
  return geometry.type === "LineString" || geometry.type === "MultiLineString";
}

function isCoordinatePair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function sanitizeLineStringCoordinates(value: unknown): [number, number][] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const coordinates: [number, number][] = [];

  for (const pair of value) {
    if (isCoordinatePair(pair)) {
      coordinates.push([pair[0], pair[1]]);
    }
  }

  return coordinates.length ? coordinates : null;
}

function sanitizeMultiLineStringCoordinates(value: unknown): [number, number][][] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const segments: [number, number][][] = [];

  for (const segment of value) {
    const sanitized = sanitizeLineStringCoordinates(segment);
    if (sanitized) {
      segments.push(sanitized);
    }
  }

  return segments.length ? segments : null;
}

function normalizeFeatureCollection(collection: FeatureCollection<Geometry>): RouteTrackGeoJson {
  const features: Feature<LineString | MultiLineString, GeoJsonProperties>[] = [];

  for (const feature of collection.features) {
    if (!feature || feature.type !== "Feature" || !feature.geometry) {
      continue;
    }

    if (!isLineStringGeometry(feature.geometry)) {
      continue;
    }

    if (feature.geometry.type === "LineString") {
      const coordinates = sanitizeLineStringCoordinates(feature.geometry.coordinates);
      if (!coordinates) {
        continue;
      }

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
        properties: feature.properties ?? {},
      });
      continue;
    }

    const multiCoordinates = sanitizeMultiLineStringCoordinates(feature.geometry.coordinates);
    if (!multiCoordinates) {
      continue;
    }

    features.push({
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: multiCoordinates,
      },
      properties: feature.properties ?? {},
    });
  }

  if (!features.length) {
    throw new Error("В треке не найдено ни одной линии");
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

function readText(buffer: ArrayBuffer | Buffer): string {
  if (Buffer.isBuffer(buffer)) {
    return buffer.toString("utf-8");
  }

  const view = new Uint8Array(buffer);
  return Buffer.from(view).toString("utf-8");
}

function getExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function haversineDistance([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Земля в км
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTrackLength(track: RouteTrackGeoJson): number {
  let total = 0;

  for (const feature of track.features) {
    if (!feature.geometry) {
      continue;
    }

    if (feature.geometry.type === "LineString") {
      const coords = feature.geometry.coordinates;
      for (let i = 1; i < coords.length; i += 1) {
        total += haversineDistance(coords[i - 1] as [number, number], coords[i] as [number, number]);
      }
    }

    if (feature.geometry.type === "MultiLineString") {
      for (const segment of feature.geometry.coordinates) {
        for (let i = 1; i < segment.length; i += 1) {
          total += haversineDistance(segment[i - 1] as [number, number], segment[i] as [number, number]);
        }
      }
    }
  }

  return total;
}

export async function convertTrackBuffer(buffer: ArrayBuffer | Buffer, fileName: string): Promise<TrackConversionResult> {
  const extension = getExtension(fileName);
  const text = readText(buffer);
  let geojson: FeatureCollection<Geometry>;

  if (extension === "gpx") {
    geojson = toGeoJson(gpx(parseXml(text)));
  } else if (extension === "kml") {
    geojson = toGeoJson(kml(parseXml(text)));
  } else if (extension === "geojson" || extension === "json") {
    const parsed = JSON.parse(text) as FeatureCollection<Geometry>;
    geojson = toGeoJson(parsed);
  } else {
    throw new Error("Поддерживаются только GPX, KML и GeoJSON");
  }

  const track = normalizeFeatureCollection(geojson);
  const segments = extractTrackSegments(track);
  const mapData = computeMapData(track, [] as RoutePointOfInterest[]);
  const pointCount = segments.reduce((acc, segment) => acc + segment.length, 0);
  const trackLengthKm = calculateTrackLength(track);
  const lengthKm = Number.isFinite(trackLengthKm)
    ? Math.round(trackLengthKm * 100) / 100
    : null;

  return {
    track,
    stats: {
      segmentCount: segments.length,
      pointCount,
      lengthKm,
      bounds: mapData.bounds,
    },
  };
}
