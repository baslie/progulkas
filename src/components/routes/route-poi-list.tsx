import type { JSX } from "react";

import { AlertTriangle, Bus, Droplets, Info, Landmark, UtensilsCrossed } from "lucide-react";

import { ROUTE_POI_CATEGORY_META } from "@/lib/routes/poi";
import type { RoutePointOfInterest } from "@/lib/routes/types";

const POI_ICON_MAP: Record<RoutePointOfInterest["category"], JSX.Element> = {
  viewpoint: <Landmark className="h-5 w-5" aria-hidden />,
  food: <UtensilsCrossed className="h-5 w-5" aria-hidden />,
  water: <Droplets className="h-5 w-5" aria-hidden />,
  transport: <Bus className="h-5 w-5" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5" aria-hidden />,
  info: <Info className="h-5 w-5" aria-hidden />,
};

export function RoutePoiList({ points }: { points: RoutePointOfInterest[] }) {
  if (!points.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Точки интереса появятся позже</p>
        <p className="mt-1">Редакция готовит подборку локаций с видами, водой и инфраструктурой.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {points.map((point) => {
        const meta = ROUTE_POI_CATEGORY_META[point.category];
        return (
          <li
            key={point.id}
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md"
          >
            <span
              className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-card"
              style={{ backgroundColor: meta.color }}
              aria-hidden
            >
              {POI_ICON_MAP[point.category]}
            </span>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">{point.name}</h4>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
              {point.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{point.description}</p>
              ) : null}
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Координаты: {point.coordinates[1].toFixed(5)}, {point.coordinates[0].toFixed(5)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
