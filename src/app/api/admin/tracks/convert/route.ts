import { NextResponse } from "next/server";

import { convertTrackBuffer } from "@/lib/routes/track-import";
import { requireAuthor } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAuthor();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Необходимо загрузить файл трека" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const result = await convertTrackBuffer(buffer, file.name);
    return NextResponse.json({ track: result.track, stats: result.stats });
  } catch (error) {
    console.error("[admin.track.convert]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось обработать трек";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
