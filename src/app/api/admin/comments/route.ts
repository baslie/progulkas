import { NextResponse } from "next/server";

import { getCurrentUser, hasRole } from "@/lib/auth/session";
import { getModerationQueue } from "@/lib/social/engagement";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, "admin")) {
    return NextResponse.json({ ok: false, error: "Требуется доступ администратора" }, { status: 403 });
  }

  const queue = await getModerationQueue();
  return NextResponse.json({ ok: true, data: queue });
}
