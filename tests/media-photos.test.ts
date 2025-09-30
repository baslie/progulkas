import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { processRoutePhoto } from "@/lib/media/photos";

describe("processRoutePhoto", () => {
  it("сжимает изображение до WebP и ограничивает размер", async () => {
    const buffer = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 3,
        background: { r: 255, g: 100, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const result = await processRoutePhoto(buffer);
    expect(result.format).toBe("image/webp");
    expect(result.width).toBeLessThanOrEqual(1920);
    expect(result.height).toBeLessThanOrEqual(1920);
    expect(result.size).toBeLessThanOrEqual(3 * 1024 * 1024);
    expect(result.dataUrl.startsWith("data:image/webp;base64,")).toBe(true);
  });
});
