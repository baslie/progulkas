import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { flagCommentForSlug } from "@/lib/social/engagement";

export async function POST(
  _request: Request,
  { params }: { params: { slug: string; commentId: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Требуется авторизация" }, { status: 401 });
  }

  const { slug, commentId } = params;

  try {
    await flagCommentForSlug(slug, commentId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось отправить жалобу";
    const status = message.toLowerCase().includes("не найден") ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
