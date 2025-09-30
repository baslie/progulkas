import { createCanvas } from "@napi-rs/canvas";

import { computeMapData } from "@/lib/routes/map";
import type { RoutePointOfInterest, RouteTrackGeoJson } from "@/lib/routes/types";

export type TrackPreviewOptions = {
  width?: number;
  height?: number;
  backgroundColor?: string;
  trackColor?: string;
  poiColor?: string;
  strokeWidth?: number;
};

export type TrackPreviewResult = {
  buffer: Buffer;
  width: number;
  height: number;
  dataUrl: string;
};

const DEFAULTS: Required<Omit<TrackPreviewOptions, "strokeWidth">> & { strokeWidth: number } = {
  width: 1200,
  height: 630,
  backgroundColor: "#0f172a",
  trackColor: "#38bdf8",
  poiColor: "#facc15",
  strokeWidth: 6,
};

function projectPoint(
  lat: number,
  lng: number,
  bounds: ReturnType<typeof computeMapData>["bounds"],
  width: number,
  height: number,
) {
  if (!bounds) {
    return { x: width / 2, y: height / 2 };
  }

  const padding = 0.08;
  const minLat = bounds[0][0];
  const minLng = bounds[0][1];
  const maxLat = bounds[1][0];
  const maxLng = bounds[1][1];

  const latRange = Math.max(maxLat - minLat, 0.0001);
  const lngRange = Math.max(maxLng - minLng, 0.0001);

  const px = (lng - minLng) / lngRange;
  const py = (maxLat - lat) / latRange;

  const innerWidth = width * (1 - padding * 2);
  const innerHeight = height * (1 - padding * 2);

  return {
    x: padding * width + px * innerWidth,
    y: padding * height + py * innerHeight,
  };
}

export function generateTrackPreview(
  track: RouteTrackGeoJson | null,
  points: RoutePointOfInterest[],
  options: TrackPreviewOptions = {},
): TrackPreviewResult {
  const settings = { ...DEFAULTS, ...options };
  const canvas = createCanvas(settings.width, settings.height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = settings.backgroundColor;
  ctx.fillRect(0, 0, settings.width, settings.height);

  const mapData = computeMapData(track, points);
  const bounds = mapData.bounds;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = settings.trackColor;
  ctx.lineWidth = settings.strokeWidth;
  ctx.globalAlpha = 0.95;

  if (mapData.segments.length) {
    ctx.beginPath();

    for (const segment of mapData.segments) {
      segment.forEach(([lat, lng], index) => {
        const { x, y } = projectPoint(lat, lng, bounds, settings.width, settings.height);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
    }

    ctx.stroke();
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.font = "700 48px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Маршрут", settings.width / 2, settings.height / 2);
  }

  if (points.length) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = settings.poiColor;

    for (const point of points) {
      const [lng, lat] = point.coordinates;
      const { x, y } = projectPoint(lat, lng, bounds, settings.width, settings.height);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(6, settings.strokeWidth - 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const buffer = canvas.toBuffer("image/webp");
  const dataUrl = `data:image/webp;base64,${buffer.toString("base64")}`;

  return { buffer, width: settings.width, height: settings.height, dataUrl };
}
