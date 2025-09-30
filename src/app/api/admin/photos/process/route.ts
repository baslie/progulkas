import { NextResponse } from "next/server";

import { processRoutePhoto } from "@/lib/media/photos";
import { requireAuthor } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAuthor();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Необходимо загрузить изображение" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const processed = await processRoutePhoto(buffer);
    return NextResponse.json({
      image: {
        dataUrl: processed.dataUrl,
        width: processed.width,
        height: processed.height,
        size: processed.size,
        format: processed.format,
      },
    });
  } catch (error) {
    console.error("[admin.photo.process]", error);
    const message =
      error instanceof Error ? error.message : "Не удалось обработать изображение";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
