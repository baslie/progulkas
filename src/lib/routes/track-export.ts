import tokml from "tokml";
import togpx from "togpx";

import type { RouteTrackGeoJson } from "./types";

type TrackMetadata = {
  title: string;
  description?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function trackToGeoJson(track: RouteTrackGeoJson): string {
  return JSON.stringify(track, null, 2);
}

export function trackToGpx(track: RouteTrackGeoJson, metadata: TrackMetadata): string {
  return togpx(track, {
    metadata: {
      name: metadata.title,
      desc: metadata.description,
    },
  });
}

export function trackToKml(track: RouteTrackGeoJson, metadata: TrackMetadata): string {
  const baseKml = tokml(track, {
    simplestyle: true,
  });

  const nameTag = `<name>${escapeXml(metadata.title)}</name>`;
  const descriptionTag = metadata.description ? `<description>${escapeXml(metadata.description)}</description>` : "";

  return baseKml.replace(
    "<Document>",
    `<Document>${nameTag}${descriptionTag}`,
  );
}
