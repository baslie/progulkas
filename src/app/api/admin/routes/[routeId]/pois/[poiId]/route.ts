import { NextResponse } from "next/server";
import { z } from "zod";

import { routePoiSchema } from "@/lib/admin/routes";
import { requireAuthor } from "@/lib/auth/session";
import { deletePoi, updatePoi } from "@/lib/routes/poi-manager";

const paramsSchema = z.object({
  routeId: z.string().min(1),
  poiId: z.string().min(1),
});

const updateSchema = routePoiSchema
  .omit({ id: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Не переданы поля для обновления",
  });

export async function PATCH(request: Request, context: { params: Promise<{ routeId: string; poiId: string }> }) {
  await requireAuthor();
  const { routeId, poiId } = paramsSchema.parse(await context.params);

  try {
    const payload = updateSchema.parse(await request.json());
    const poi = await updatePoi(routeId, poiId, payload);
    return NextResponse.json({ point: poi });
  } catch (error) {
    console.error("[admin.poi.update]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось обновить точку";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ routeId: string; poiId: string }> }) {
  await requireAuthor();
  const { routeId, poiId } = paramsSchema.parse(await context.params);

  try {
    await deletePoi(routeId, poiId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin.poi.delete]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось удалить точку";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
