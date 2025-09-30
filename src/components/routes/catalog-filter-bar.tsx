"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Filter, Loader2, Search, X } from "lucide-react";

import {
  DISTANCE_FILTERS,
  DURATION_FILTERS,
  ROUTE_AUDIENCES,
  ROUTE_DIFFICULTIES,
  type DistanceFilterValue,
  type DurationFilterValue,
  type RouteAudienceValue,
  type RouteDifficultyValue,
} from "@/lib/routes/constants";
import type { CatalogFilters } from "@/lib/routes/types";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

type CatalogFilterBarProps = {
  initialFilters: CatalogFilters;
};

export function CatalogFilterBar({ initialFilters }: CatalogFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialFilters.query ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearchValue(initialFilters.query ?? "");
  }, [initialFilters.query]);

  const selectedDifficulties = useMemo(() => new Set(initialFilters.difficulties), [initialFilters.difficulties]);
  const selectedAudiences = useMemo(() => new Set(initialFilters.audiences), [initialFilters.audiences]);

  const updateSearchParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      const nextQuery = params.toString();
      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  const toggleMultiValue = useCallback(
    (key: string, value: RouteDifficultyValue | RouteAudienceValue) => {
      updateSearchParams((params) => {
        const current = params.get(key);
        const values = current ? current.split(",").filter(Boolean) : [];
        const exists = values.includes(value);

        if (exists) {
          const next = values.filter((item) => item !== value);
          if (next.length) {
            params.set(key, next.join(","));
          } else {
            params.delete(key);
          }
        } else {
          values.push(value);
          params.set(key, values.join(","));
        }
      });
    },
    [updateSearchParams],
  );

  const toggleSingleValue = useCallback(
    (key: string, value: DistanceFilterValue | DurationFilterValue) => {
      updateSearchParams((params) => {
        if (params.get(key) === value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
    },
    [updateSearchParams],
  );

  const resetFilters = useCallback(() => {
    updateSearchParams((params) => {
      params.delete("q");
      params.delete("difficulty");
      params.delete("distance");
      params.delete("duration");
      params.delete("audience");
    });
    setSearchValue("");
  }, [updateSearchParams]);

  useEffect(() => {
    const trimmed = searchValue.trim();
    if ((initialFilters.query ?? "") === trimmed) {
      return;
    }

    const handle = setTimeout(() => {
      updateSearchParams((params) => {
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }
      });
    }, 400);

    return () => clearTimeout(handle);
  }, [searchValue, initialFilters.query, updateSearchParams]);

  const hasActiveFilters =
    Boolean(initialFilters.query) ||
    initialFilters.difficulties.length > 0 ||
    initialFilters.audiences.length > 0 ||
    Boolean(initialFilters.distance) ||
    Boolean(initialFilters.duration);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Найдите маршрут по названию или описанию"
              className="h-10 w-full rounded-lg bg-background pl-9"
              aria-label="Поиск маршрута"
            />
            {searchValue ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
                onClick={() => setSearchValue("")}
                aria-label="Очистить поиск"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <Filter className="mr-2 h-4 w-4" aria-hidden /> Сбросить фильтры
            </Button>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterGroup title="Сложность">
          {ROUTE_DIFFICULTIES.map((option) => {
            const isActive = selectedDifficulties.has(option.value);
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={isActive}
                className={cn(
                  "justify-start",
                  isActive && "border-primary bg-primary/10 text-primary",
                )}
                onClick={() => toggleMultiValue("difficulty", option.value)}
              >
                <span className="font-medium">{option.label}</span>
              </Button>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Длина">
          {DISTANCE_FILTERS.map((option) => {
            const isActive = initialFilters.distance === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={isActive}
                className={cn(
                  "justify-start",
                  isActive && "border-primary bg-primary/10 text-primary",
                )}
                onClick={() => toggleSingleValue("distance", option.value)}
              >
                <span className="font-medium">{option.label}</span>
              </Button>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Длительность">
          {DURATION_FILTERS.map((option) => {
            const isActive = initialFilters.duration === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={isActive}
                className={cn(
                  "justify-start",
                  isActive && "border-primary bg-primary/10 text-primary",
                )}
                onClick={() => toggleSingleValue("duration", option.value)}
              >
                <span className="font-medium">{option.label}</span>
              </Button>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Для кого">
          {ROUTE_AUDIENCES.map((option) => {
            const isActive = selectedAudiences.has(option.value);
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={isActive}
                className={cn(
                  "justify-start",
                  isActive && "border-primary bg-primary/10 text-primary",
                )}
                onClick={() => toggleMultiValue("audience", option.value)}
              >
                <span className="font-medium">{option.label}</span>
              </Button>
            );
          })}
        </FilterGroup>
      </div>
    </section>
  );
}

type FilterGroupProps = {
  title: string;
  children: React.ReactNode;
};

function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <fieldset className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {children}
      </div>
    </fieldset>
  );
}
