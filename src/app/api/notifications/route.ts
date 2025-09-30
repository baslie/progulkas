import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getNotificationsForUser, markNotificationsAsRead } from "@/lib/social/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Требуется авторизация" }, { status: 401 });
  }

  const notifications = await getNotificationsForUser(user.id);
  return NextResponse.json({ ok: true, data: notifications });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Требуется авторизация" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : undefined;

  await markNotificationsAsRead(user.id, ids);
  return NextResponse.json({ ok: true });
}
