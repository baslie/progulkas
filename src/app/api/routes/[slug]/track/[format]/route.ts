import { NextResponse } from "next/server";

import { getRouteTrackForExport } from "@/lib/routes/queries";
import { trackToGeoJson, trackToGpx, trackToKml } from "@/lib/routes/track-export";

const SUPPORTED_FORMATS = ["gpx", "kml", "geojson"] as const;

type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

type RouteTrackParams = {
  slug: string;
  format: string;
};

function createDownloadResponse(content: string, filename: string, contentType: string) {
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function isSupportedFormat(format: string): format is SupportedFormat {
  return SUPPORTED_FORMATS.includes(format as SupportedFormat);
}

export async function GET(
  _request: Request,
  { params }: { params: RouteTrackParams | Promise<RouteTrackParams> },
) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.trim();
  const requestedFormat = resolvedParams.format.toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: "Не указан маршрут" }, { status: 400 });
  }

  if (!isSupportedFormat(requestedFormat)) {
    return NextResponse.json({ error: "Формат не поддерживается" }, { status: 400 });
  }

  const route = await getRouteTrackForExport(slug);

  if (!route) {
    return NextResponse.json({ error: "Трек не найден или недоступен" }, { status: 404 });
  }

  const filename = `${route.slug}.${requestedFormat}`;
  const metadata = {
    title: route.title,
    description: `Маршрут «${route.title}» на платформе Маршруты Прогулки`,
  };

  if (requestedFormat === "geojson") {
    const geojson = trackToGeoJson(route.trackGeoJson);
    return createDownloadResponse(geojson, filename, "application/geo+json; charset=utf-8");
  }

  if (requestedFormat === "gpx") {
    const gpx = trackToGpx(route.trackGeoJson, metadata);
    return createDownloadResponse(gpx, filename, "application/gpx+xml; charset=utf-8");
  }

  const kml = trackToKml(route.trackGeoJson, metadata);
  return createDownloadResponse(kml, filename, "application/vnd.google-earth.kml+xml; charset=utf-8");
}
