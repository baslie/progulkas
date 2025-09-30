import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser, hasRole } from "@/lib/auth/session";
import { getUnreadNotificationsCount } from "@/lib/social/notifications";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unreadCount = user ? await getUnreadNotificationsCount(user.id) : 0;
  const isAuthor = hasRole(user, "author") || hasRole(user, "admin");

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
            П
          </span>
          <span className="sr-only">Маршруты Прогулки</span>
          <span aria-hidden>Маршруты Прогулки</span>
        </Link>
        <nav aria-label="Основная навигация" className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/catalog" className="transition hover:text-primary">
            Каталог
          </Link>
          <Link href="/features" className="transition hover:text-primary">
            Возможности
          </Link>
          <Link href="/about" className="transition hover:text-primary">
            О проекте
          </Link>
          {isAuthor ? (
            <Link href="/admin" className="transition hover:text-primary">
              Админка
            </Link>
          ) : null}
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-foreground transition hover:border-primary hover:text-primary"
            >
              Уведомления
              {unreadCount ? (
                <span className="inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <div className="hidden flex-col text-right text-xs text-muted-foreground sm:flex">
              <span className="text-sm font-medium text-foreground">{user.name ?? user.email}</span>
              <span>{user.email}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/sign-in">Войти</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Регистрация</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
