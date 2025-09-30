import { NextResponse } from "next/server";

import { getCurrentUser, hasRole } from "@/lib/auth/session";
import { moderateComment } from "@/lib/social/engagement";

const ALLOWED_STATUSES = new Set(["PUBLISHED", "PENDING", "REJECTED", "HIDDEN"]);

export async function POST(
  request: Request,
  { params }: { params: { commentId: string } },
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, "admin")) {
    return NextResponse.json({ ok: false, error: "Требуется доступ администратора" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const status = String(body?.status ?? "").toUpperCase();
    if (!status) {
      throw new Error("Статус не указан");
    }

    if (!ALLOWED_STATUSES.has(status)) {
      throw new Error("Недопустимый статус");
    }

    await moderateComment(params.commentId, status as "PUBLISHED" | "PENDING" | "REJECTED" | "HIDDEN", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить статус";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
