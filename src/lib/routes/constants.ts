export const ROUTE_DIFFICULTIES = [
  {
    value: "EASY" as const,
    label: "Лёгкий",
    description: "Спокойная прогулка без перепадов высоты и сложного покрытия.",
  },
  {
    value: "MODERATE" as const,
    label: "Средний",
    description: "Требует базовой подготовки: умеренная длина и локальные подъёмы.",
  },
  {
    value: "CHALLENGING" as const,
    label: "Сложный",
    description: "Продвинутый маршрут с длительными участками и переменчивым рельефом.",
  },
] as const;

export const ROUTE_AUDIENCES = [
  { value: "WALK" as const, label: "Пешком" },
  { value: "RUN" as const, label: "Для бега" },
  { value: "FAMILY" as const, label: "Семейный отдых" },
  { value: "BIKE" as const, label: "Вело" },
  { value: "STROLLER" as const, label: "С коляской" },
] as const;

export const ROUTE_STATUSES = [
  { value: "DRAFT" as const, label: "Черновик" },
  { value: "REVIEW" as const, label: "На модерации" },
  { value: "PUBLISHED" as const, label: "Опубликован" },
  { value: "ARCHIVED" as const, label: "Архив" },
] as const;

export const DISTANCE_FILTERS = [
  { value: "short" as const, label: "До 5 км", range: { max: 5 } },
  { value: "medium" as const, label: "5–15 км", range: { min: 5, max: 15 } },
  { value: "long" as const, label: "Более 15 км", range: { min: 15 } },
] as const;

export const DURATION_FILTERS = [
  { value: "short" as const, label: "До 1,5 часа", range: { max: 90 } },
  { value: "medium" as const, label: "1,5–3 часа", range: { min: 90, max: 180 } },
  { value: "long" as const, label: "Более 3 часов", range: { min: 180 } },
] as const;

export type RouteDifficultyValue = (typeof ROUTE_DIFFICULTIES)[number]["value"];
export type RouteAudienceValue = (typeof ROUTE_AUDIENCES)[number]["value"];
export type RouteStatusValue = (typeof ROUTE_STATUSES)[number]["value"];
export type DistanceFilterValue = (typeof DISTANCE_FILTERS)[number]["value"];
export type DurationFilterValue = (typeof DURATION_FILTERS)[number]["value"];

type NumericRange = { min?: number; max?: number };

export const DISTANCE_RANGE_BY_VALUE: Record<DistanceFilterValue, NumericRange> = Object.fromEntries(
  DISTANCE_FILTERS.map((filter) => [filter.value, filter.range]),
) as Record<DistanceFilterValue, NumericRange>;

export const DURATION_RANGE_BY_VALUE: Record<DurationFilterValue, NumericRange> = Object.fromEntries(
  DURATION_FILTERS.map((filter) => [filter.value, filter.range]),
) as Record<DurationFilterValue, NumericRange>;

export const ROUTE_DIFFICULTY_LABELS: Record<RouteDifficultyValue, string> = Object.fromEntries(
  ROUTE_DIFFICULTIES.map(({ value, label }) => [value, label]),
) as Record<RouteDifficultyValue, string>;

export const ROUTE_AUDIENCE_LABELS: Record<RouteAudienceValue, string> = Object.fromEntries(
  ROUTE_AUDIENCES.map(({ value, label }) => [value, label]),
) as Record<RouteAudienceValue, string>;

export const ROUTE_STATUS_LABELS: Record<RouteStatusValue, string> = Object.fromEntries(
  ROUTE_STATUSES.map(({ value, label }) => [value, label]),
) as Record<RouteStatusValue, string>;

export function getDifficultyLabel(value: RouteDifficultyValue) {
  return ROUTE_DIFFICULTY_LABELS[value] ?? value;
}

export function getAudienceLabel(value: RouteAudienceValue) {
  return ROUTE_AUDIENCE_LABELS[value] ?? value;
}

export function getStatusLabel(value: RouteStatusValue) {
  return ROUTE_STATUS_LABELS[value] ?? value;
}
