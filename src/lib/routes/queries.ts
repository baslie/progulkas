import { prisma } from "@/lib/prisma";

import {
  DISTANCE_RANGE_BY_VALUE,
  DURATION_RANGE_BY_VALUE,
  ROUTE_AUDIENCES,
  ROUTE_DIFFICULTIES,
} from "./constants";
import type { CatalogFilters, CatalogRoute, RawRouteRecord } from "./types";

const DEFAULT_LIMIT = 24;
const SEARCH_DICTIONARY = "russian";
const difficultySet = new Set(ROUTE_DIFFICULTIES.map((option) => option.value));
const audienceSet = new Set(ROUTE_AUDIENCES.map((option) => option.value));

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "object" && value !== null && "toNumber" in value) {
    try {
      return (value as { toNumber: () => number }).toNumber();
    } catch (error) {
      console.warn("Не удалось преобразовать Decimal значение", error);
      return 0;
    }
  }

  return Number(value ?? 0);
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = toNumber(value);
  return Number.isNaN(numeric) ? null : numeric;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ensureStringArray(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function escapeLiteral(input: string): string {
  return input.replace(/'/g, "''");
}

function buildEnumList(values: string[]): string {
  return values.map((value) => `'${escapeLiteral(value)}'`).join(", ");
}

function buildRangeConditions(column: string, range: { min?: number; max?: number } | undefined): string[] {
  if (!range) {
    return [];
  }

  const conditions: string[] = [];

  if (typeof range.min === "number") {
    conditions.push(`"${column}" >= ${range.min}`);
  }

  if (typeof range.max === "number") {
    conditions.push(`"${column}" <= ${range.max}`);
  }

  return conditions;
}

function serializeRoute(record: RawRouteRecord): CatalogRoute {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    city: record.city,
    region: record.region,
    difficulty: record.difficulty,
    distanceKm: toNumber(record.distanceKm),
    durationMinutes: record.durationMinutes,
    suitableFor: record.suitableFor,
    tags: ensureStringArray(record.tags),
    highlights: ensureStringArray(record.highlights),
    coverImageUrl: record.coverImageUrl,
    ratingAverage: toNullableNumber(record.ratingAverage),
    ratingCount: record.ratingCount,
    publishedAt: toDate(record.publishedAt),
    createdAt: toDate(record.createdAt) ?? new Date(0),
  };
}

function buildCatalogQuery(filters: CatalogFilters): string {
  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, 60);
  const textVector = `to_tsvector('${SEARCH_DICTIONARY}', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("city", '') || ' ' || coalesce("region", '') || ' ' || coalesce(array_to_string("tags", ' '), '') || ' ' || coalesce(array_to_string("highlights", ' '), ''))`;
  const conditions: string[] = ['"isPublished" = true'];

  let searchQuerySql: string | null = null;

  if (filters.query) {
    const sanitized = escapeLiteral(filters.query);
    searchQuerySql = `plainto_tsquery('${SEARCH_DICTIONARY}', '${sanitized}')`;
    conditions.push(`${textVector} @@ ${searchQuerySql}`);
  }

  const difficulties = Array.from(new Set(filters.difficulties.filter((value) => difficultySet.has(value))));
  if (difficulties.length) {
    conditions.push(`"difficulty" IN (${buildEnumList(difficulties)})`);
  }

  const audiences = Array.from(new Set(filters.audiences.filter((value) => audienceSet.has(value))));
  if (audiences.length) {
    conditions.push(`"suitableFor" && ARRAY[${buildEnumList(audiences)}]::"RouteAudience"[]`);
  }

  const distanceRange = filters.distance ? DISTANCE_RANGE_BY_VALUE[filters.distance] : undefined;
  const durationRange = filters.duration ? DURATION_RANGE_BY_VALUE[filters.duration] : undefined;

  conditions.push(...buildRangeConditions("distanceKm", distanceRange));
  conditions.push(...buildRangeConditions("durationMinutes", durationRange));

  const whereClause = conditions.join(" AND ");

  const orderClause = searchQuerySql
    ? `ORDER BY ts_rank_cd(${textVector}, ${searchQuerySql}) DESC, "createdAt" DESC`
    : `ORDER BY "ratingAverage" DESC NULLS LAST, "ratingCount" DESC, "createdAt" DESC`;

  return `
    SELECT
      "id",
      "slug",
      "title",
      "summary",
      "city",
      "region",
      "difficulty",
      "distanceKm",
      "durationMinutes",
      "suitableFor",
      "tags",
      "highlights",
      "coverImageUrl",
      "ratingAverage",
      "ratingCount",
      "isPublished",
      "publishedAt",
      "createdAt",
      "updatedAt"
    FROM "Route"
    WHERE ${whereClause}
    ${orderClause}
    LIMIT ${limit}
  `;
}

export async function getCatalogRoutes(filters: CatalogFilters): Promise<CatalogRoute[]> {
  const query = buildCatalogQuery(filters);
  const rows = (await prisma.$queryRawUnsafe(query)) as RawRouteRecord[];
  return rows.map(serializeRoute);
}

export async function getFeaturedRoutes(limit = 3): Promise<CatalogRoute[]> {
  const routes = await getCatalogRoutes({
    query: undefined,
    difficulties: [],
    audiences: [],
    distance: undefined,
    duration: undefined,
    limit,
  });

  return routes;
}
