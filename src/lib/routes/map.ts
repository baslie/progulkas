import type { RoutePointOfInterest, RouteTrackGeoJson } from "./types";

export type LatLng = [number, number];

type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

function updateBounds(bounds: Bounds | null, lat: number, lng: number): Bounds {
  if (!bounds) {
    return { minLat: lat, maxLat: lat, minLng: lng, maxLng: lng };
  }

  return {
    minLat: Math.min(bounds.minLat, lat),
    maxLat: Math.max(bounds.maxLat, lat),
    minLng: Math.min(bounds.minLng, lng),
    maxLng: Math.max(bounds.maxLng, lng),
  };
}

export function extractTrackSegments(track: RouteTrackGeoJson | null): LatLng[][] {
  if (!track) {
    return [];
  }

  const segments: LatLng[][] = [];

  for (const feature of track.features) {
    if (!feature.geometry) {
      continue;
    }

    if (feature.geometry.type === "LineString") {
      const line = feature.geometry.coordinates
        .map((pair) => (Array.isArray(pair) && pair.length >= 2 ? [pair[1], pair[0]] : null))
        .filter((value): value is LatLng => Array.isArray(value));

      if (line.length) {
        segments.push(line);
      }
    }

    if (feature.geometry.type === "MultiLineString") {
      for (const segment of feature.geometry.coordinates) {
        const line = segment
          .map((pair) => (Array.isArray(pair) && pair.length >= 2 ? [pair[1], pair[0]] : null))
          .filter((value): value is LatLng => Array.isArray(value));

        if (line.length) {
          segments.push(line);
        }
      }
    }
  }

  return segments;
}

export function calculateTrackBounds(segments: LatLng[][]): Bounds | null {
  let bounds: Bounds | null = null;

  for (const segment of segments) {
    for (const [lat, lng] of segment) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      bounds = updateBounds(bounds, lat, lng);
    }
  }

  return bounds;
}

export function calculatePoiBounds(points: RoutePointOfInterest[]): Bounds | null {
  let bounds: Bounds | null = null;

  for (const point of points) {
    const [lng, lat] = point.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    bounds = updateBounds(bounds, lat, lng);
  }

  return bounds;
}

export function mergeBounds(trackBounds: Bounds | null, poiBounds: Bounds | null): Bounds | null {
  if (!trackBounds && !poiBounds) {
    return null;
  }

  let bounds = trackBounds ?? null;
  if (poiBounds) {
    bounds = updateBounds(bounds, poiBounds.minLat, poiBounds.minLng);
    bounds = updateBounds(bounds, poiBounds.minLat, poiBounds.maxLng);
    bounds = updateBounds(bounds, poiBounds.maxLat, poiBounds.minLng);
    bounds = updateBounds(bounds, poiBounds.maxLat, poiBounds.maxLng);
  }

  return bounds;
}

export function boundsToLeaflet(bounds: Bounds | null): [LatLng, LatLng] | null {
  if (!bounds) {
    return null;
  }

  return [
    [bounds.minLat, bounds.minLng],
    [bounds.maxLat, bounds.maxLng],
  ];
}

export function computeMapData(track: RouteTrackGeoJson | null, points: RoutePointOfInterest[]) {
  const segments = extractTrackSegments(track);
  const trackBounds = calculateTrackBounds(segments);
  const poiBounds = calculatePoiBounds(points);
  const merged = mergeBounds(trackBounds, poiBounds);

  return {
    segments,
    bounds: boundsToLeaflet(merged),
  };
}
