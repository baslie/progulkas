import Link from "next/link";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
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
          <a href="/features" className="transition hover:text-primary">
            Возможности
          </a>
          <a href="/about" className="transition hover:text-primary">
            О проекте
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/sign-in">Войти</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/sign-up">Регистрация</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
