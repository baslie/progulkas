import { NextResponse } from "next/server";
import { z } from "zod";

import { routePoiSchema } from "@/lib/admin/routes";
import { requireAuthor } from "@/lib/auth/session";
import { createPoi, listRoutePoints } from "@/lib/routes/poi-manager";

const paramsSchema = z.object({ routeId: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ routeId: string }> }) {
  await requireAuthor();
  const { routeId } = paramsSchema.parse(await context.params);
  const points = await listRoutePoints(routeId);
  return NextResponse.json({ points });
}

export async function POST(request: Request, context: { params: Promise<{ routeId: string }> }) {
  await requireAuthor();
  const { routeId } = paramsSchema.parse(await context.params);

  try {
    const payload = routePoiSchema.parse(await request.json());
    const poi = await createPoi(routeId, payload);
    return NextResponse.json({ point: poi }, { status: 201 });
  } catch (error) {
    console.error("[admin.poi.create]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось сохранить точку";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
