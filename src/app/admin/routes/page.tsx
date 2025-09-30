import Link from "next/link";
import { z } from "zod";

import { listRoutesForAdmin } from "@/lib/admin/routes";
import { ROUTE_STATUSES, getAudienceLabel, getDifficultyLabel, getStatusLabel } from "@/lib/routes/constants";
import type { RouteStatusValue } from "@/lib/routes/constants";
import { cn, formatDistance, formatDuration } from "@/lib/utils";

const statusValues = ROUTE_STATUSES.map((status) => status.value) as RouteStatusValue[];

const searchSchema = z.object({
  status: z.enum(statusValues).optional(),
});

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminRoutesPage(props: PageProps) {
  const searchParams = searchSchema.parse(await props.searchParams);
  const requestedStatus = searchParams.status;
  const routes = await listRoutesForAdmin();
  type AdminRoute = (typeof routes)[number];
  const filtered = requestedStatus
    ? routes.filter((route: AdminRoute) => route.status === requestedStatus)
    : routes;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Маршруты</h1>
          <p className="text-sm text-muted-foreground">
            Управляйте публикациями, следите за статусами и редактируйте данные маршрутов.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow"
          href="/admin/routes/new"
        >
          Создать маршрут
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/routes"
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Все ({routes.length})
        </Link>
        {ROUTE_STATUSES.map((status) => (
          <Link
            key={status.value}
            href={`/admin/routes?status=${status.value}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              requestedStatus === status.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {status.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Маршрут</th>
              <th className="px-4 py-3">Фильтры</th>
              <th className="px-4 py-3">Подходит</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Обновлён</th>
              <th className="px-4 py-3">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background/60">
            {filtered.map((route: AdminRoute) => (
              <tr key={route.id}>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <Link className="font-medium text-foreground hover:text-primary" href={`/admin/routes/${route.id}`}>
                      {route.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{route.city}, {route.region}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <span>{getDifficultyLabel(route.difficulty)}</span>
                    <span>{formatDistance(route.distanceKm)}</span>
                    <span>{formatDuration(route.durationMinutes)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {route.suitableFor.length
                    ? route.suitableFor
                        .map((audience: AdminRoute["suitableFor"][number]) => getAudienceLabel(audience))
                        .join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {getStatusLabel(route.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(route.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/catalog/${route.slug}`}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Просмотр
                    </Link>
                    <Link
                      href={`/admin/routes/${route.id}`}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      Редактировать
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
