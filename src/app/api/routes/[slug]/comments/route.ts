import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createCommentForSlug, getRouteEngagementSnapshot } from "@/lib/social/engagement";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Требуется авторизация" }, { status: 401 });
  }

  const { slug } = params;

  try {
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content : "";
    const parentId = typeof body?.parentId === "string" ? body.parentId : null;

    await createCommentForSlug(slug, {
      authorId: user.id,
      content,
      parentId,
    });

    const data = await getRouteEngagementSnapshot(slug, user.id);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить комментарий";
    const status = message.toLowerCase().includes("не найден") ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
