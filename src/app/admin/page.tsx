import Link from "next/link";

import { requireAuthor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ROUTE_STATUSES, getStatusLabel } from "@/lib/routes/constants";
import type { RouteStatusValue } from "@/lib/routes/constants";
import { formatDistance, formatDuration } from "@/lib/utils";

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminDashboardPage() {
  await requireAuthor();

  const [routeGroups, totalUsers, editorUsers, recentRoutes] = await Promise.all([
    prisma.route.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.user.count(),
    prisma.user.count({
      where: {
        roles: {
          some: {
            role: {
              name: { in: ["author", "admin"] },
            },
          },
        },
      },
    }),
    prisma.route.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        authors: {
          include: {
            user: true,
          },
        },
      },
    }),
  ]);

  const statusCountMap = new Map<RouteStatusValue, number>();
  for (const status of ROUTE_STATUSES) {
    statusCountMap.set(status.value, 0);
  }

  for (const group of routeGroups) {
    statusCountMap.set(group.status as RouteStatusValue, group._count.status);
  }

  const totalRoutes = Array.from(statusCountMap.values()).reduce((acc, count) => acc + count, 0);
  type RecentRoute = (typeof recentRoutes)[number];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Панель управления</h1>
        <p className="text-sm text-muted-foreground">
          Следите за статусами маршрутов, авторами и активностью платформы.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">Маршруты</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{totalRoutes}</p>
          <p className="text-xs text-muted-foreground">Всего в базе</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">Авторы</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{editorUsers}</p>
          <p className="text-xs text-muted-foreground">Авторские аккаунты</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">Пользователи</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{totalUsers}</p>
          <p className="text-xs text-muted-foreground">Подтверждённые аккаунты</p>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Статусы маршрутов</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROUTE_STATUSES.map((status) => (
            <div
              key={status.value}
              className="rounded-2xl border border-dashed border-border bg-background/80 p-4"
            >
              <p className="text-xs uppercase text-muted-foreground">{status.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {statusCountMap.get(status.value) ?? 0}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Последние изменения</h2>
            <p className="text-sm text-muted-foreground">
              Маршруты, которые недавно редактировались или были опубликованы.
            </p>
          </div>
          <Link className="text-sm font-medium text-primary" href="/admin/routes">
            Открыть список
          </Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-muted-foreground">Маршрут</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Длина</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Длительность</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Статус</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Обновлён</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentRoutes.map((route: RecentRoute) => (
                <tr key={route.id} className="bg-background/60">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <Link
                        href={`/admin/routes/${route.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {route.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {route.authors
                          .map((author: RecentRoute["authors"][number]) => author.user.name ?? author.user.email)
                          .join(", ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistance(Number(route.distanceKm))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDuration(route.durationMinutes)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {getStatusLabel(route.status as RouteStatusValue)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(route.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Журнал аудита</h2>
            <p className="text-sm text-muted-foreground">
              Просматривайте действия администраторов и авторов: публикации, изменения маршрутов и модерацию комментариев.
            </p>
          </div>
          <Link href="/admin/audit-log" className="inline-flex items-center rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary">
            Перейти к журналу
          </Link>
        </div>
      </section>
    </div>
  );
}
