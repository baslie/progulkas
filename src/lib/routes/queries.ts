import { prisma } from "@/lib/prisma";

import {
  DISTANCE_RANGE_BY_VALUE,
  DURATION_RANGE_BY_VALUE,
  ROUTE_AUDIENCES,
  ROUTE_DIFFICULTIES,
  ROUTE_STATUSES,
} from "./constants";
import type {
  CatalogFilters,
  CatalogRoute,
  RawRouteDetailsRecord,
  RawRouteRecord,
  RouteAuthorSummary,
  RouteDetails,
  RoutePointOfInterest,
  RouteTrackGeoJson,
} from "./types";
import type { Feature, GeoJsonProperties, LineString, MultiLineString } from "geojson";

const DEFAULT_LIMIT = 24;
const SEARCH_DICTIONARY = "russian";
const difficultySet = new Set(ROUTE_DIFFICULTIES.map((option) => option.value));
const audienceSet = new Set(ROUTE_AUDIENCES.map((option) => option.value));
const statusSet = new Set(ROUTE_STATUSES.map((option) => option.value));

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

function sanitizeMarkdown(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function sanitizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function sanitizeInterestingFacts(value: string[] | null): string[] {
  return ensureStringArray(value).map((item) => item.trim()).filter(Boolean);
}

const poiCategorySet = new Set<RoutePointOfInterest["category"]>([
  "viewpoint",
  "food",
  "water",
  "transport",
  "warning",
  "info",
]);

function sanitizePoiCategory(value: unknown): RoutePointOfInterest["category"] | null {
  if (typeof value !== "string") {
    return null;
  }

  return poiCategorySet.has(value as RoutePointOfInterest["category"]) ? (value as RoutePointOfInterest["category"]) : null;
}

function isCoordinatePair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function sanitizeLineStringCoordinates(value: unknown): [number, number][] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const coordinates: [number, number][] = [];

  for (const pair of value) {
    if (isCoordinatePair(pair)) {
      coordinates.push([pair[0], pair[1]]);
    }
  }

  return coordinates.length ? coordinates : null;
}

function sanitizeMultiLineStringCoordinates(value: unknown): [number, number][][] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const segments: [number, number][][] = [];

  for (const segment of value) {
    const sanitized = sanitizeLineStringCoordinates(segment);
    if (sanitized) {
      segments.push(sanitized);
    }
  }

  return segments.length ? segments : null;
}

function sanitizeTrackGeoJson(value: unknown): RouteTrackGeoJson | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { type?: unknown; features?: unknown };
  if (record.type !== "FeatureCollection" || !Array.isArray(record.features)) {
    return null;
  }

  const features: Feature<LineString | MultiLineString, GeoJsonProperties>[] = [];

  for (const feature of record.features) {
    if (!feature || typeof feature !== "object") {
      continue;
    }

    const featureRecord = feature as {
      type?: unknown;
      geometry?: unknown;
      properties?: unknown;
    };

    if (featureRecord.type !== "Feature" || !featureRecord.geometry || typeof featureRecord.geometry !== "object") {
      continue;
    }

    const geometryRecord = featureRecord.geometry as {
      type?: unknown;
      coordinates?: unknown;
    };

    const baseProperties =
      featureRecord.properties && typeof featureRecord.properties === "object"
        ? (featureRecord.properties as GeoJsonProperties)
        : {};

    if (geometryRecord.type === "LineString") {
      const coordinates = sanitizeLineStringCoordinates(geometryRecord.coordinates);
      if (!coordinates) {
        continue;
      }

      const sanitizedFeature: Feature<LineString, GeoJsonProperties> = {
        type: "Feature",
        geometry: { type: "LineString", coordinates },
        properties: baseProperties,
      };

      features.push(sanitizedFeature);
      continue;
    }

    if (geometryRecord.type === "MultiLineString") {
      const coordinates = sanitizeMultiLineStringCoordinates(geometryRecord.coordinates);
      if (!coordinates) {
        continue;
      }

      const sanitizedFeature: Feature<MultiLineString, GeoJsonProperties> = {
        type: "Feature",
        geometry: { type: "MultiLineString", coordinates },
        properties: baseProperties,
      };

      features.push(sanitizedFeature);
    }
  }

  return features.length
    ? {
        type: "FeatureCollection",
        features,
      }
    : null;
}

function sanitizePointsOfInterest(value: unknown): RoutePointOfInterest[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const points: RoutePointOfInterest[] = [];

  for (const rawPoint of value) {
    if (!rawPoint || typeof rawPoint !== "object") {
      continue;
    }

    const pointRecord = rawPoint as {
      id?: unknown;
      name?: unknown;
      description?: unknown;
      category?: unknown;
      coordinates?: unknown;
    };

    if (typeof pointRecord.id !== "string" || typeof pointRecord.name !== "string") {
      continue;
    }

    const category = sanitizePoiCategory(pointRecord.category);
    if (!category) {
      continue;
    }

    const coordinates = Array.isArray(pointRecord.coordinates) && isCoordinatePair(pointRecord.coordinates)
      ? (pointRecord.coordinates as [number, number])
      : null;

    if (!coordinates) {
      continue;
    }

    points.push({
      id: pointRecord.id,
      name: pointRecord.name,
      description: typeof pointRecord.description === "string" ? pointRecord.description : null,
      category,
      coordinates,
    });
  }

  return points;
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
    previewImageUrl: record.previewImageUrl,
    galleryImageUrls: ensureStringArray(record.galleryImageUrls),
    ratingAverage: toNullableNumber(record.ratingAverage),
    ratingCount: record.ratingCount,
    status: statusSet.has(record.status) ? record.status : "DRAFT",
    publishedAt: toDate(record.publishedAt),
    createdAt: toDate(record.createdAt) ?? new Date(0),
  };
}

function serializeRouteDetails(record: RawRouteDetailsRecord): RouteDetails {
  const base = serializeRoute(record);

  return {
    ...base,
    descriptionMarkdown: sanitizeMarkdown(record.descriptionMarkdown),
    howToGet: sanitizeOptionalText(record.howToGet),
    howToReturn: sanitizeOptionalText(record.howToReturn),
    safetyNotes: sanitizeOptionalText(record.safetyNotes),
    interestingFacts: sanitizeInterestingFacts(record.interestingFacts),
    trackGeoJson: sanitizeTrackGeoJson(record.trackGeoJson),
    trackSourceFormat: typeof record.trackSourceFormat === "string" ? record.trackSourceFormat : null,
    trackSourceFilename: typeof record.trackSourceFilename === "string" ? record.trackSourceFilename : null,
    trackUpdatedAt: toDate(record.trackUpdatedAt),
    pointsOfInterest: sanitizePointsOfInterest(record.pointsOfInterest),
    authors: [],
  };
}

function buildCatalogQuery(filters: CatalogFilters): string {
  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, 60);
  const textVector = `to_tsvector('${SEARCH_DICTIONARY}', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("city", '') || ' ' || coalesce("region", '') || ' ' || coalesce(array_to_string("tags", ' '), '') || ' ' || coalesce(array_to_string("highlights", ' '), ''))`;
  const conditions: string[] = ['"status" = \'PUBLISHED\''];

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
      "previewImageUrl",
      "galleryImageUrls",
      "ratingAverage",
      "ratingCount",
      "status",
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

function buildRouteDetailsQuery(slug: string): string {
  const sanitizedSlug = escapeLiteral(slug);

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
      "previewImageUrl",
      "galleryImageUrls",
      "ratingAverage",
      "ratingCount",
      "status",
      "isPublished",
      "publishedAt",
      "createdAt",
      "updatedAt",
      "descriptionMarkdown",
      "howToGet",
      "howToReturn",
      "safetyNotes",
      "interestingFacts",
      "trackGeoJson",
      "trackSourceFormat",
      "trackSourceFilename",
      "trackUpdatedAt",
      "pointsOfInterest"
    FROM "Route"
    WHERE "slug" = '${sanitizedSlug}' AND "status" = 'PUBLISHED'
    LIMIT 1
  `;
}

async function getRouteAuthors(routeId: string): Promise<RouteAuthorSummary[]> {
  const records = await prisma.routeAuthor.findMany({
    where: { routeId },
    include: {
      user: true,
    },
    orderBy: {
      assignedAt: "asc",
    },
  });

  type RouteAuthorRecord = (typeof records)[number];

  return records.map((record: RouteAuthorRecord): RouteAuthorSummary => ({
    id: record.userId,
    name: record.user.name,
    email: record.user.email,
  }));
}

export async function getCatalogRoutes(filters: CatalogFilters): Promise<CatalogRoute[]> {
  const query = buildCatalogQuery(filters);
  const rows = (await prisma.$queryRawUnsafe(query)) as RawRouteRecord[];
  return rows.map(serializeRoute);
}

export async function getRouteDetailsBySlug(slug: string): Promise<RouteDetails | null> {
  const query = buildRouteDetailsQuery(slug);
  const rows = (await prisma.$queryRawUnsafe(query)) as RawRouteDetailsRecord[];
  const record = rows[0];
  if (!record) {
    return null;
  }

  const details = serializeRouteDetails(record);
  details.authors = await getRouteAuthors(details.id);
  return details;
}

export async function getRouteTrackForExport(slug: string) {
  const details = await getRouteDetailsBySlug(slug);
  if (!details || !details.trackGeoJson) {
    return null;
  }

  return {
    id: details.id,
    slug: details.slug,
    title: details.title,
    trackGeoJson: details.trackGeoJson,
  };
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
