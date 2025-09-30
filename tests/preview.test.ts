import { describe, expect, it } from "vitest";

import { generateTrackPreview } from "@/lib/routes/preview";
import type { RouteTrackGeoJson } from "@/lib/routes/types";

describe("generateTrackPreview", () => {
  it("создаёт изображение превью для трека", () => {
    const track: RouteTrackGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [84.97, 56.5],
              [84.98, 56.51],
              [84.99, 56.52],
            ],
          },
        },
      ],
    };

    const preview = generateTrackPreview(track, [], { width: 400, height: 240 });
    expect(preview.width).toBe(400);
    expect(preview.height).toBe(240);
    expect(preview.buffer.byteLength).toBeGreaterThan(0);
    expect(preview.dataUrl.startsWith("data:image/webp;base64,")).toBe(true);
  });
});
