import type { Metadata } from "next";

import { CatalogFilterBar } from "@/components/routes/catalog-filter-bar";
import { RouteCard } from "@/components/routes/route-card";
import { getCatalogRoutes } from "@/lib/routes/queries";
import { parseCatalogSearchParams } from "@/lib/routes/search-params";

export const metadata: Metadata = {
  title: "Каталог маршрутов",
  description:
    "Выберите прогулку по сложности, длительности и формату, чтобы спланировать идеальный день в Томске и регионе.",
};

type CatalogPageSearchParams = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: CatalogPageSearchParams;
}) {
  const resolvedParams = await searchParams;
  const filters = parseCatalogSearchParams(resolvedParams);
  const routes = await getCatalogRoutes({ ...filters });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Каталог прогулочных маршрутов
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Фильтруйте маршруты по длительности, сложности и формату отдыха. Поиск работает по названию, описанию и тегам —
              начните вводить, чтобы увидеть актуальные совпадения.
            </p>
          </div>
          <span className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-muted/40 px-4 text-sm font-medium text-muted-foreground">
            {routes.length ? `${routes.length} маршрутов` : "Маршрутов пока нет"}
          </span>
        </div>
      </header>

      <CatalogFilterBar initialFilters={filters} />

      <section aria-live="polite" className="space-y-6">
        {routes.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-10 text-center text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">Маршруты не найдены</p>
            <p className="mt-2">Попробуйте изменить фильтры или сбросить поиск — мы подбираем только опубликованные маршруты.</p>
          </div>
        )}
      </section>
    </div>
  );
}
