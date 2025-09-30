import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { hasRole, requireAuthor } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Админка — Маршруты Прогулки",
  description: "Управление маршрутами, треками и пользователями",
};

const NAV_ITEMS: (AdminNavItem & { roles?: string[] })[] = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/routes", label: "Маршруты" },
  { href: "/admin/routes/new", label: "Новый маршрут" },
  { href: "/admin/tracks", label: "Треки", roles: ["admin", "author"] },
  { href: "/admin/users", label: "Пользователи", roles: ["admin"] },
  { href: "/admin/comments", label: "Комментарии", roles: ["admin"] },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthor();
  const items = NAV_ITEMS.filter((item) => {
    if (!item.roles?.length) {
      return true;
    }

    return item.roles.some((role) => hasRole(user, role));
  });

  return (
    <div className="min-h-screen bg-slate-950/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 lg:flex-row lg:py-16">
        <aside className="w-full max-w-xs space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Вы вошли как</p>
              <p className="text-lg font-semibold text-foreground">{user.name ?? user.email}</p>
              <p className="text-xs text-muted-foreground">Роли: {user.roles.join(", ")}</p>
            </div>
            <div className="mt-6">
              <AdminNav items={items} />
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
            Доступ к админке открыт только авторам и администраторам. Помните о проверке данных перед публикацией маршрутов.
          </div>
        </aside>
        <main className={cn("flex-1 space-y-6", "pb-10")}>{children}</main>
      </div>
    </div>
  );
}
