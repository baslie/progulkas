import { describe, expect, it } from "vitest";

import { computeMapData, extractTrackSegments } from "@/lib/routes/map";
import type { RoutePointOfInterest, RouteTrackGeoJson } from "@/lib/routes/types";

const mockTrack: RouteTrackGeoJson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [84.95, 56.48],
          [84.96, 56.49],
          [84.97, 56.5],
        ],
      },
      properties: {},
    },
    {
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [84.98, 56.51],
            [84.99, 56.515],
          ],
          [
            [85.0, 56.52],
            [85.01, 56.53],
          ],
        ],
      },
      properties: {},
    },
  ],
};

const mockPois: RoutePointOfInterest[] = [
  {
    id: "view-1",
    name: "Смотровая точка",
    category: "viewpoint",
    coordinates: [84.955, 56.495],
    description: null,
  },
  {
    id: "water-1",
    name: "Родник",
    category: "water",
    coordinates: [85.02, 56.535],
    description: "Чистая питьевая вода",
  },
];

describe("routes map helpers", () => {
  it("extracts line segments from GeoJSON", () => {
    const segments = extractTrackSegments(mockTrack);
    expect(segments).toHaveLength(3);
    expect(segments[0][0]).toEqual([56.48, 84.95]);
    expect(segments[2][1]).toEqual([56.53, 85.01]);
  });

  it("computes bounds using track and POI data", () => {
    const { bounds, segments } = computeMapData(mockTrack, mockPois);
    expect(segments.length).toBe(3);
    expect(bounds).toEqual([
      [56.48, 84.95],
      [56.535, 85.02],
    ]);
  });

  it("falls back to POI bounds when track is missing", () => {
    const { bounds, segments } = computeMapData(null, mockPois);
    expect(segments).toHaveLength(0);
    expect(bounds).toEqual([
      [56.495, 84.955],
      [56.535, 85.02],
    ]);
  });
});
