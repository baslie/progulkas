import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getRouteEngagementSnapshot } from "@/lib/social/engagement";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  try {
    const user = await getCurrentUser();
    const data = await getRouteEngagementSnapshot(slug, user?.id ?? null);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось получить данные";
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  }
}
