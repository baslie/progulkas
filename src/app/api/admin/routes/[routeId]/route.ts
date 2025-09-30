import { NextResponse } from "next/server";
import { z } from "zod";

import { getRouteForAdmin, updateRoute } from "@/lib/admin/routes";
import { hasRole, requireAuthor } from "@/lib/auth/session";

const paramsSchema = z.object({ routeId: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ routeId: string }> }) {
  const user = await requireAuthor();
  const { routeId } = paramsSchema.parse(await context.params);
  const route = await getRouteForAdmin(routeId);

  const canView = hasRole(user, "admin") || route.authors.some((author) => author.id === user.id);
  if (!canView) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  return NextResponse.json({ route });
}

export async function PATCH(request: Request, context: { params: Promise<{ routeId: string }> }) {
  const user = await requireAuthor();
  const { routeId } = paramsSchema.parse(await context.params);

  const existing = await getRouteForAdmin(routeId);
  const canEdit = hasRole(user, "admin") || existing.authors.some((author) => author.id === user.id);

  if (!canEdit) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const route = await updateRoute(routeId, payload);
    return NextResponse.json({ route });
  } catch (error) {
    console.error("[admin.routes.update]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось обновить маршрут";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
