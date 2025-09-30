import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { setRouteRatingForSlug } from "@/lib/social/engagement";

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
    const value = Number(body?.value ?? 0);
    const data = await setRouteRatingForSlug(slug, user.id, value);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить оценку";
    const status = message.toLowerCase().includes("не найден") ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
