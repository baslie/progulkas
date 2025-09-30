import type { RoutePointOfInterestCategory } from "./types";

export const ROUTE_POI_CATEGORY_META: Record<
  RoutePointOfInterestCategory,
  { label: string; color: string }
> = {
  viewpoint: { label: "Смотровая точка", color: "#2563eb" },
  food: { label: "Еда и кофе", color: "#f97316" },
  water: { label: "Вода", color: "#0ea5e9" },
  transport: { label: "Транспорт", color: "#22c55e" },
  warning: { label: "Предупреждение", color: "#f43f5e" },
  info: { label: "Полезная точка", color: "#a855f7" },
};
