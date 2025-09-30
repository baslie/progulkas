import { describe, expect, it } from "vitest";

import { convertTrackBuffer } from "@/lib/routes/track-import";

const GPX_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Vitest">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="56.5000" lon="84.9700"></trkpt>
      <trkpt lat="56.5100" lon="84.9800"></trkpt>
      <trkpt lat="56.5200" lon="84.9900"></trkpt>
    </trkseg>
  </trk>
</gpx>`;

const KML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <LineString>
      <coordinates>
        84.9700,56.5000,0 84.9800,56.5100,0
      </coordinates>
    </LineString>
  </Placemark>
</kml>`;

const GEOJSON_SAMPLE = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [84.97, 56.5],
          [84.98, 56.51],
        ],
      },
    },
  ],
};

describe("convertTrackBuffer", () => {
  it("конвертирует GPX в GeoJSON", async () => {
    const result = await convertTrackBuffer(Buffer.from(GPX_SAMPLE), "track.gpx");
    expect(result.track.features.length).toBeGreaterThan(0);
    expect(result.stats.segmentCount).toBe(1);
    expect(result.stats.pointCount).toBe(3);
    expect(result.stats.lengthKm).toBeGreaterThan(0);
  });

  it("конвертирует KML", async () => {
    const result = await convertTrackBuffer(Buffer.from(KML_SAMPLE), "track.kml");
    expect(result.track.features[0]?.geometry?.type).toBe("LineString");
    expect(result.stats.segmentCount).toBe(1);
  });

  it("принимает GeoJSON", async () => {
    const result = await convertTrackBuffer(Buffer.from(JSON.stringify(GEOJSON_SAMPLE)), "track.geojson");
    expect(result.track.features[0]?.geometry?.type).toBe("LineString");
  });
});
