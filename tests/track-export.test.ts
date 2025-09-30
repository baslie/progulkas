import { describe, expect, it } from "vitest";

import { trackToGeoJson, trackToGpx, trackToKml } from "@/lib/routes/track-export";
import type { RouteTrackGeoJson } from "@/lib/routes/types";

const track: RouteTrackGeoJson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [84.95, 56.48],
          [84.96, 56.49],
        ],
      },
      properties: {},
    },
  ],
};

describe("track export", () => {
  it("serializes GeoJSON with indentation", () => {
    const result = trackToGeoJson(track);
    expect(result).toContain("\n  \"type\"");
    expect(JSON.parse(result).features).toHaveLength(1);
  });

  it("creates GPX with metadata", () => {
    const result = trackToGpx(track, {
      title: "Маршрут",
      description: "Тестовый трек",
    });

    expect(result).toContain("<gpx");
    expect(result).toContain("Маршрут");
    expect(result).toContain("Тестовый трек");
  });

  it("creates KML with metadata", () => {
    const result = trackToKml(track, {
      title: "Маршрут",
      description: "Тестовый трек",
    });

    expect(result).toContain("<kml");
    expect(result).toContain("Маршрут");
  });
});
