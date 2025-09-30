import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RouteActions } from "@/components/routes/route-actions";
import { RouteDescription } from "@/components/routes/route-description";
import { RouteInfoBlock } from "@/components/routes/route-info-block";
import { RouteMap } from "@/components/routes/route-map";
import { RoutePoiList } from "@/components/routes/route-poi-list";
import { Button } from "@/components/ui/button";
import { getAudienceLabel, getDifficultyLabel } from "@/lib/routes/constants";
import { getRouteDetailsBySlug } from "@/lib/routes/queries";
import { formatDistance, formatDuration } from "@/lib/utils";
import {
  AlertTriangle,
  Bus,
  MapPin,
  Navigation2,
  Sparkles,
  Star,
} from "lucide-react";

type RoutePageParams = { slug: string };

type RoutePageProps = {
  params: RoutePageParams | Promise<RoutePageParams>;
};

export async function generateMetadata({ params }: { params: RoutePageProps["params"] }): Promise<Metadata> {
  const { slug } = await params;
  const route = await getRouteDetailsBySlug(slug);

  if (!route) {
    return {
      title: "Маршрут недоступен — Маршруты Прогулки",
      description: "Маршрут снят с публикации или временно недоступен.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${route.title} — Маршруты Прогулки`;
  const primaryImage = route.coverImageUrl ?? route.previewImageUrl ?? undefined;

  return {
    title,
    description: route.summary,
    openGraph: {
      title,
      description: route.summary,
      type: "article",
      url: `/catalog/${route.slug}`,
      images: primaryImage
        ? [
            {
              url: primaryImage,
              width: 1200,
              height: 630,
              alt: route.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { slug } = await params;
  const route = await getRouteDetailsBySlug(slug);

  if (!route) {
    notFound();
  }

  const ratingLabel =
    route.ratingAverage !== null
      ? `${route.ratingAverage.toFixed(1)} · ${route.ratingCount} оценок`
      : route.ratingCount > 0
        ? `${route.ratingCount} оценок`
        : "Маршрут ждёт первых отзывов";

  const stats = [
    { label: "Длина", value: formatDistance(route.distanceKm) },
    { label: "Длительность", value: formatDuration(route.durationMinutes) },
    { label: "Сложность", value: getDifficultyLabel(route.difficulty) },
  ];

  const hasMapData = Boolean(route.trackGeoJson) || route.pointsOfInterest.length > 0;
  const heroImage = route.coverImageUrl ?? route.previewImageUrl;

  return (
    <div className="space-y-12 pb-16">
      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="relative">
          <div className="absolute inset-0">
            {heroImage ? (
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-secondary/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/92 to-background/96" />
          </div>

          <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {route.city}, {route.region}
                </span>
                <span className="inline-flex items-center gap-2 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-500" aria-hidden />
                  {ratingLabel}
                </span>
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                {route.title}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{route.summary}</p>
              {route.highlights.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {route.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-border bg-background/80 px-3 py-1 font-medium"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="space-y-4 rounded-2xl border border-border bg-background/90 p-6 shadow-inner">
              <dl className="grid gap-4 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
                    <dd className="text-lg font-semibold text-foreground">{stat.value}</dd>
                  </div>
                ))}
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Подходит</dt>
                  <dd className="flex flex-wrap gap-2">
                    {route.suitableFor.length ? (
                      route.suitableFor.map((audience) => (
                        <span
                          key={audience}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {getAudienceLabel(audience)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Уточняется</span>
                    )}
                  </dd>
                </div>
              </dl>
              {route.tags.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {route.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-dashed border-border px-2.5 py-1"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </article>

      <RouteActions slug={route.slug} hasTrack={Boolean(route.trackGeoJson)} />

      <section className="grid gap-10 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-8">
          <RouteDescription markdown={route.descriptionMarkdown} />
        </div>
        <div className="space-y-5">
          <RouteInfoBlock
            title="Как добраться"
            icon={<Bus className="h-5 w-5" aria-hidden />}
            content={route.howToGet}
            emptyLabel="Маршрут проезда уточняется"
          />
          <RouteInfoBlock
            title="Как уехать"
            icon={<Navigation2 className="h-5 w-5" aria-hidden />}
            content={route.howToReturn}
            emptyLabel="Информация о возвращении появится позже"
          />
          <RouteInfoBlock
            title="Риски и предупреждения"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
            content={route.safetyNotes}
            emptyLabel="Опасных участков пока не отмечено"
          />
          <RouteInfoBlock
            title="Интересные факты"
            icon={<Sparkles className="h-5 w-5" aria-hidden />}
            emptyLabel="Факты будут добавлены командой редакторов"
          >
            {route.interestingFacts.length ? (
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {route.interestingFacts.map((fact) => (
                  <li key={fact} className="flex gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </RouteInfoBlock>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Маршрут на карте</h2>
          {hasMapData ? (
            <RouteMap track={route.trackGeoJson} points={route.pointsOfInterest} />
          ) : (
            <div className="flex h-[340px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/10 text-sm text-muted-foreground">
              Трек и точки интереса появятся после публикации данных OpenStreetMap
            </div>
          )}
          {!route.trackGeoJson ? (
            <p className="text-xs text-muted-foreground">
              Мы работаем над визуализацией трека на основе данных OpenStreetMap и спутниковых снимков.
            </p>
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Точки интереса</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {route.pointsOfInterest.length} точек
            </span>
          </div>
          <RoutePoiList points={route.pointsOfInterest} />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Готовы поделиться впечатлениями?</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Маршрут будет обновляться по мере появления отзывов и данных от сообщества. Расскажите нам о состоянии троп, инфраструктуре и новых точках интереса.
            </p>
          </div>
          <Button variant="secondary" size="lg" disabled>
            Скоро добавим отзывы
          </Button>
        </div>
      </section>
    </div>
  );
}
