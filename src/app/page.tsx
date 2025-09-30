import Link from "next/link";

import { RouteCard } from "@/components/routes/route-card";
import { getFeaturedRoutes } from "@/lib/routes/queries";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Интерактивные карты",
    description: "Стройте маршруты на основе данных OpenStreetMap с указанием интересных точек и покрытия троп.",
  },
  {
    title: "Треки и аналитика",
    description: "Импортируйте GPX, KML или GeoJSON, анализируйте набор высоты и делитесь с друзьями.",
  },
  {
    title: "Социальные функции",
    description: "Обсуждайте маршруты, собирайте отзывы и прокладывайте совместные прогулки с сообществом.",
  },
];

export default async function HomePage() {
  const featuredRoutes = await getFeaturedRoutes();

  return (
    <div className="space-y-20">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
            Новая платформа для городских и природных прогулок
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Планируйте прогулки, исследуйте маршруты и делитесь впечатлениями
          </h1>
          <p className="text-lg text-muted-foreground">
            «Маршруты Прогулки» объединяет любовь к путешествиям и современные технологии. Мы уже запустили первую подборку
            маршрутов по Томску и окрестностям — с фильтрами по сложности, длительности и формату отдыха.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Создать аккаунт</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/catalog">Посмотреть каталог маршрутов</Link>
            </Button>
          </div>
          <dl className="grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Маршрутов в разработке</dt>
              <dd className="text-2xl font-semibold">120+</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Покрытие регионов</dt>
              <dd className="text-2xl font-semibold">30 городов</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Сообщество бета-тестеров</dt>
              <dd className="text-2xl font-semibold">1 500 человек</dd>
            </div>
          </dl>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(88,91,248,0.25),_transparent_60%)]" />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Актуальный маршрут недели</h2>
            <p className="text-sm text-muted-foreground">
              Еженедельно мы обновляем подборку прогулок для вдохновения: от набережных Санкт-Петербурга до лавовых полей
              Камчатки.
            </p>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/10 p-4 text-sm text-primary-foreground">
              <p className="font-medium">Сестрорецк — Зеленогорск</p>
              <p>12 км · лёгкий уровень · доступен с коляской</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Каталог уже доступен: фильтруйте маршруты по сложности и длительности, сохраняйте понравившиеся и планируйте
              поездку заранее.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Первые маршруты в каталоге</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Каталог пополняется каждую неделю. Пока доступны прогулки по городу и ближайшим природным локациям — они уже
              готовы к использованию и поддерживают фильтрацию по формату.
            </p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/catalog">Открыть полный каталог</Link>
          </Button>
        </div>

        {featuredRoutes.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Каталог в процессе наполнения</p>
            <p className="mt-2 max-w-2xl">
              Мы завершаем импорт первых маршрутов и откроем доступ в ближайшие дни. Подпишитесь на новости, чтобы узнать о
              запуске первыми.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-12">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-semibold">Зачем присоединяться уже сегодня?</h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground">
            Мы строим инфраструктуру, которая поможет авторам и путешественникам совместно развивать прогулочную культуру в
            городах и регионах.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 text-center shadow-lg">
        <h2 className="text-3xl font-semibold">Подпишитесь на новости разработки</h2>
        <p className="mt-3 text-base text-muted-foreground">
          Получайте дайджест новых функций, тестов и запусков. Мы пишем только по делу.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="Электронная почта"
            className="h-12 w-full max-w-md rounded-md border border-border bg-background px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Электронная почта"
          />
          <Button size="lg" className="sm:w-auto">
            Подписаться
          </Button>
        </div>
      </section>
    </div>
  );
}
