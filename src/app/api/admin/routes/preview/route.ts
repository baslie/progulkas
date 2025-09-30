import { NextResponse } from "next/server";
import { z } from "zod";

import { routePoiSchema, routeTrackGeoJsonSchema } from "@/lib/admin/routes";
import { requireAuthor } from "@/lib/auth/session";
import { generateTrackPreview } from "@/lib/routes/preview";
import type { RoutePointOfInterest, RouteTrackGeoJson } from "@/lib/routes/types";

export const runtime = "nodejs";

const previewRequestSchema = z.object({
  trackGeoJson: routeTrackGeoJsonSchema.nullable().optional(),
  pointsOfInterest: z.array(routePoiSchema).optional(),
  options: z
    .object({
      width: z.number().int().min(200).max(2000).optional(),
      height: z.number().int().min(200).max(2000).optional(),
      backgroundColor: z.string().optional(),
      trackColor: z.string().optional(),
      poiColor: z.string().optional(),
      strokeWidth: z.number().min(1).max(20).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  await requireAuthor();

  try {
    const payload = previewRequestSchema.parse(await request.json());
    const track = (payload.trackGeoJson ?? null) as RouteTrackGeoJson | null;
    const points = (payload.pointsOfInterest ?? []) as RoutePointOfInterest[];
    const preview = generateTrackPreview(track, points, payload.options);

    return NextResponse.json({
      preview: {
        dataUrl: preview.dataUrl,
        width: preview.width,
        height: preview.height,
        size: preview.buffer.byteLength,
      },
    });
  } catch (error) {
    console.error("[admin.preview]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось сгенерировать превью";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
