import {
  DISTANCE_FILTERS,
  DURATION_FILTERS,
  ROUTE_AUDIENCES,
  ROUTE_DIFFICULTIES,
  type DistanceFilterValue,
  type DurationFilterValue,
  type RouteAudienceValue,
  type RouteDifficultyValue,
} from "./constants";
import type { CatalogFilters } from "./types";

const difficultySet = new Set<RouteDifficultyValue>(
  ROUTE_DIFFICULTIES.map((item) => item.value),
);

const audienceSet = new Set<RouteAudienceValue>(
  ROUTE_AUDIENCES.map((item) => item.value),
);

const distanceSet = new Set<DistanceFilterValue>(
  DISTANCE_FILTERS.map((item) => item.value),
);

const durationSet = new Set<DurationFilterValue>(
  DURATION_FILTERS.map((item) => item.value),
);

type CatalogSearchParams = Record<string, string | string[] | undefined>;

function parseListParam<T extends string>(rawValue: string | string[] | undefined, allowed: Set<T>): T[] {
  if (!rawValue) {
    return [];
  }

  const values = Array.isArray(rawValue)
    ? rawValue.flatMap((item) => item.split(","))
    : rawValue.split(",");

  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => allowed.has(value as T)))) as T[];
}

export function parseCatalogSearchParams(searchParams: CatalogSearchParams): CatalogFilters {
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : undefined;

  const difficulties = parseListParam(searchParams.difficulty, difficultySet);
  const audiences = parseListParam(searchParams.audience, audienceSet);

  const distance = typeof searchParams.distance === "string" && distanceSet.has(searchParams.distance as DistanceFilterValue)
    ? (searchParams.distance as DistanceFilterValue)
    : undefined;

  const duration = typeof searchParams.duration === "string" && durationSet.has(searchParams.duration as DurationFilterValue)
    ? (searchParams.duration as DurationFilterValue)
    : undefined;

  return {
    query: query || undefined,
    difficulties,
    audiences,
    distance,
    duration,
  };
}
