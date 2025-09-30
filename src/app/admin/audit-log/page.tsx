import { listAuditLogEntries } from "@/lib/admin/audit-log";
import { requireAdmin } from "@/lib/auth/session";

function formatTimestamp(dateIso: string) {
  const date = new Date(dateIso);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AuditLogPage() {
  await requireAdmin();
  const entries = await listAuditLogEntries(100);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Контроль изменений</p>
        <h1 className="text-3xl font-semibold tracking-tight">Журнал аудита</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Здесь фиксируются действия администраторов и авторов: публикация и редактирование маршрутов, модерация комментариев и
          другие важные события. Данные помогают отслеживать ответственность и решать спорные ситуации.
        </p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Время</th>
              <th className="px-4 py-3 font-medium">Событие</th>
              <th className="px-4 py-3 font-medium">Объект</th>
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Детали</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background/80">
            {entries.length ? (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatTimestamp(entry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{entry.label}</div>
                    <div className="text-xs text-muted-foreground">{entry.action}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{entry.entity ?? "—"}</div>
                    {entry.entityId ? <div className="text-xs">ID: {entry.entityId}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{entry.actorEmail ?? "—"}</div>
                    {entry.ipAddress ? <div className="text-xs">IP: {entry.ipAddress}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <pre className="whitespace-pre-wrap text-xs leading-snug">
                      {JSON.stringify(entry.metadata ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Событий пока нет. Как только появятся действия администраторов и авторов, они отобразятся в журнале.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
