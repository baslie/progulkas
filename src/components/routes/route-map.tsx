import dynamic from "next/dynamic";

import type { RoutePointOfInterest, RouteTrackGeoJson } from "@/lib/routes/types";

const DynamicRouteMap = dynamic(
  () => import("./route-map.client").then((mod) => mod.RouteMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[340px] w-full items-center justify-center rounded-3xl border border-dashed border-border bg-muted/10 text-sm text-muted-foreground">
        Загрузка карты OpenStreetMap…
      </div>
    ),
  },
);

type RouteMapProps = {
  track: RouteTrackGeoJson | null;
  points: RoutePointOfInterest[];
};

export function RouteMap({ track, points }: RouteMapProps) {
  return <DynamicRouteMap track={track} points={points} />;
}
