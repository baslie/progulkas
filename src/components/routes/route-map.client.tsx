"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { computeMapData } from "@/lib/routes/map";
import { ROUTE_POI_CATEGORY_META } from "@/lib/routes/poi";
import type { RoutePointOfInterest, RouteTrackGeoJson } from "@/lib/routes/types";
import type { LatLng } from "@/lib/routes/map";

const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> участники';
const FALLBACK_CENTER: LatLng = [56.4847, 84.9482];

function MapBoundsUpdater({ bounds }: { bounds: [LatLng, LatLng] | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [32, 32] });
    }
  }, [bounds, map]);

  return null;
}

function PoiMarker({ point }: { point: RoutePointOfInterest }) {
  const meta = ROUTE_POI_CATEGORY_META[point.category];

  const icon = useMemo(
    () =>
      L.divIcon({
        className: "poi-marker",
        html: `<span class="poi-marker__dot" style="--poi-marker-color: ${meta.color}"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -20],
      }),
    [meta.color],
  );

  return (
    <Marker position={[point.coordinates[1], point.coordinates[0]]} icon={icon}>
      <Popup>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{point.name}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{meta.label}</p>
          {point.description ? (
            <p className="text-xs leading-relaxed text-muted-foreground/80">{point.description}</p>
          ) : null}
        </div>
      </Popup>
    </Marker>
  );
}

type RouteMapClientProps = {
  track: RouteTrackGeoJson | null;
  points: RoutePointOfInterest[];
};

export function RouteMapClient({ track, points }: RouteMapClientProps) {
  const { segments, bounds } = useMemo(() => computeMapData(track, points), [track, points]);

  const center = useMemo(() => {
    if (!bounds) {
      return FALLBACK_CENTER;
    }

    return [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2,
    ] as LatLng;
  }, [bounds]);

  return (
    <MapContainer
      center={center}
      bounds={bounds ?? undefined}
      zoom={13}
      minZoom={6}
      className="h-full w-full rounded-3xl border border-border"
      scrollWheelZoom={false}
      style={{ minHeight: "340px" }}
    >
      <TileLayer attribution={TILE_LAYER_ATTRIBUTION} url={TILE_LAYER_URL} />
      {bounds ? <MapBoundsUpdater bounds={bounds} /> : null}
      {segments.map((segment, index) => (
        <Polyline key={index} positions={segment} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }} />
      ))}
      {points.map((point) => (
        <PoiMarker key={point.id} point={point} />
      ))}
    </MapContainer>
  );
}
