import Link from "next/link";

import { MessageCircle, Star } from "lucide-react";

import { getAudienceLabel, getDifficultyLabel } from "@/lib/routes/constants";
import type { CatalogRoute } from "@/lib/routes/types";
import { cn, formatDistance, formatDuration } from "@/lib/utils";

type RouteCardProps = {
  route: CatalogRoute;
};

const gradientPalette = [
  "from-sky-500/70 to-indigo-500/70",
  "from-emerald-500/70 to-teal-500/70",
  "from-orange-500/70 to-pink-500/70",
  "from-violet-500/70 to-fuchsia-500/70",
];

function getGradient(id: string) {
  const index = Math.abs(id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradientPalette.length;
  return gradientPalette[index];
}

export function RouteCard({ route }: RouteCardProps) {
  const gradient = getGradient(route.id);
  const imageUrl = route.coverImageUrl ?? route.previewImageUrl;
  const ratingLabel =
    route.ratingAverage !== null
      ? `${route.ratingAverage.toFixed(1)} · ${route.ratingCount} оценок`
      : route.ratingCount > 0
        ? `${route.ratingCount} оценок`
        : "Новый маршрут";

  return (
    <article className="group h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        <Link
          href={`/catalog/${route.slug}`}
          prefetch={false}
          className="relative block aspect-[4/3] overflow-hidden"
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              imageUrl ? "from-black/40 to-black/70" : gradient,
            )}
          />
          {imageUrl ? (
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm text-white">
            <p className="text-xs uppercase tracking-widest text-white/80">{route.region}</p>
            <p className="text-lg font-semibold leading-tight">{route.city}</p>
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-5 p-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
              <span>{getDifficultyLabel(route.difficulty)}</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500" aria-hidden />
                  <span>{ratingLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                  {route.commentCount}
                </span>
              </div>
            </div>
            <h3 className="text-xl font-semibold leading-tight tracking-tight text-foreground">{route.title}</h3>
            <p className="line-clamp-3 text-sm text-muted-foreground">{route.summary}</p>
          </header>

          <dl className="grid gap-4 text-sm text-foreground sm:grid-cols-3">
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Длина</dt>
              <dd className="font-medium">{formatDistance(route.distanceKm)}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Длительность</dt>
              <dd className="font-medium">{formatDuration(route.durationMinutes)}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Подходит</dt>
              <dd className="font-medium">
                {route.suitableFor.length
                  ? getAudienceLabel(route.suitableFor[0])
                  : "Уточняется"}
                {route.suitableFor.length > 1 ? ` +${route.suitableFor.length - 1}` : ""}
              </dd>
            </div>
          </dl>

          {route.highlights.length ? (
            <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {route.highlights.slice(0, 3).map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-full border border-dashed border-border px-3 py-1 text-muted-foreground"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              {route.suitableFor.slice(0, 3).map((audience) => (
                <span
                  key={audience}
                  className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground"
                >
                  {getAudienceLabel(audience)}
                </span>
              ))}
            </div>
            <span className="rounded-full border border-dashed border-border px-3 py-1 text-muted-foreground">
              Подробнее
            </span>
          </footer>
        </div>
      </div>
    </article>
  );
}
