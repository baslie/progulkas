import { requireAuthor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDistance, formatDuration } from "@/lib/utils";

export default async function TracksAdminPage() {
  await requireAuthor();

  const routesWithTracks = await prisma.route.findMany({
    where: { trackGeoJson: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      slug: true,
      trackSourceFilename: true,
      trackSourceFormat: true,
      distanceKm: true,
      durationMinutes: true,
      updatedAt: true,
    },
  });
  type RouteWithTrack = (typeof routesWithTracks)[number];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Файлы треков</h1>
        <p className="text-sm text-muted-foreground">
          Здесь собраны маршруты с загруженными треками. При необходимости замените исходный файл и сгенерируйте новое превью.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <p>
          Для замены трека загрузите новый файл в форме редактирования маршрута. Треки автоматически конвертируются в GeoJSON, а
          исходный формат хранится для аудита.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Маршрут</th>
              <th className="px-4 py-3">Исходный файл</th>
              <th className="px-4 py-3">Длина</th>
              <th className="px-4 py-3">Длительность</th>
              <th className="px-4 py-3">Обновлён</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background/60">
            {routesWithTracks.map((route: RouteWithTrack) => (
              <tr key={route.id}>
                <td className="px-4 py-3 text-foreground">{route.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {route.trackSourceFilename ?? "Конвертировано"} ({route.trackSourceFormat ?? "GeoJSON"})
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDistance(Number(route.distanceKm))}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDuration(route.durationMinutes)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(route.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
