import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function UsersAdminPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
  type AdminUser = (typeof users)[number];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Пользователи</h1>
        <p className="text-sm text-muted-foreground">
          Управляйте доступом и ролями. Редактирование прав выполняется вручную через базу данных в рамках текущей версии.
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Пользователь</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Роли</th>
              <th className="px-4 py-3">Создан</th>
              <th className="px-4 py-3">Подтверждён</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background/60">
            {users.map((user: AdminUser) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-foreground">{user.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.roles
                    .map((item: AdminUser["roles"][number]) => item.role.name)
                    .join(", ") || "user"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.emailVerified
                    ? new Intl.DateTimeFormat("ru-RU", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(user.emailVerified)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
