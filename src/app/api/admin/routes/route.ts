import { NextResponse } from "next/server";

import { createRoute, listRoutesForAdmin } from "@/lib/admin/routes";
import { requireAuthor } from "@/lib/auth/session";
import { getRequestClientMetadata } from "@/lib/http/request";

export async function GET() {
  await requireAuthor();
  const routes = await listRoutesForAdmin();
  return NextResponse.json({ routes });
}

export async function POST(request: Request) {
  const user = await requireAuthor();

  try {
    const payload = await request.json();
    const metadata = getRequestClientMetadata(request);
    const route = await createRoute(payload, user.id, { actorEmail: user.email, ...metadata });
    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    console.error("[admin.routes]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось создать маршрут";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
