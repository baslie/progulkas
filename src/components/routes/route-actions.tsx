import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

const TRACK_FORMATS = [
  { format: "gpx", label: "GPX" },
  { format: "kml", label: "KML" },
  { format: "geojson", label: "GeoJSON" },
] as const;

type RouteActionsProps = {
  slug: string;
  hasTrack: boolean;
};

export function RouteActions({ slug, hasTrack }: RouteActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" className="gap-2" asChild disabled={!hasTrack}>
          <a
            href={`/api/routes/${slug}/track/${TRACK_FORMATS[0].format}`}
            download={`${slug}.${TRACK_FORMATS[0].format}`}
          >
            <Download className="h-4 w-4" aria-hidden />
            Скачать трек ({TRACK_FORMATS[0].label})
          </a>
        </Button>
        <div className="flex flex-wrap gap-2">
          {TRACK_FORMATS.slice(1).map((item) => (
            <Button key={item.format} variant="outline" size="sm" asChild disabled={!hasTrack}>
              <a href={`/api/routes/${slug}/track/${item.format}`} download={`${slug}.${item.format}`}>
                {item.label}
              </a>
            </Button>
          ))}
        </div>
      </div>
      <Button variant="outline" className="gap-2" asChild>
        <a href={`/api/routes/${slug}/print`}>
          <FileText className="h-4 w-4" aria-hidden />
          Печать в PDF
        </a>
      </Button>
    </div>
  );
}
