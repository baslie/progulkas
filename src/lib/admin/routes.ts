import { randomUUID } from "node:crypto";

import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  ROUTE_AUDIENCES,
  ROUTE_DIFFICULTIES,
  ROUTE_STATUSES,
  type RouteAudienceValue,
  type RouteDifficultyValue,
  type RouteStatusValue,
} from "@/lib/routes/constants";
import type { RouteAuthorSummary, RouteDetails } from "@/lib/routes/types";
import { slugify } from "@/lib/utils";

const coordinateSchema = z.tuple([z.number(), z.number()]);

export const routePoiSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  category: z.enum([
    "viewpoint",
    "food",
    "water",
    "transport",
    "warning",
    "info",
  ]),
  coordinates: coordinateSchema,
});

const lineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(coordinateSchema).min(2),
});

const multiLineStringSchema = z.object({
  type: z.literal("MultiLineString"),
  coordinates: z.array(z.array(coordinateSchema).min(2)).min(1),
});

export const routeTrackGeoJsonSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z
    .array(
      z.object({
        type: z.literal("Feature"),
        geometry: z.union([lineStringSchema, multiLineStringSchema]),
        properties: z.record(z.string(), z.any()).optional(),
      }),
    )
    .min(1),
});

const statusValues = ROUTE_STATUSES.map((status) => status.value) as RouteStatusValue[];
const difficultyValues = ROUTE_DIFFICULTIES.map((difficulty) => difficulty.value) as RouteDifficultyValue[];
const audienceValues = ROUTE_AUDIENCES.map((audience) => audience.value) as RouteAudienceValue[];

function normalizeStringArray(value: string[] | undefined | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const trimmed = item.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }

  return Array.from(unique);
}

export const routeEditorSchema = z
  .object({
    title: z.string().min(5, "Название должно содержать минимум 5 символов"),
    summary: z.string().min(20, "Краткое описание минимум 20 символов"),
    city: z.string().min(2),
    region: z.string().min(2),
    difficulty: z.enum(difficultyValues),
    distanceKm: z.number().positive(),
    durationMinutes: z.number().int().positive(),
    suitableFor: z.array(z.enum(audienceValues)).min(1),
    tags: z.array(z.string()).optional(),
    highlights: z.array(z.string()).optional(),
    descriptionMarkdown: z.string().min(50, "Полное описание минимум 50 символов"),
    howToGet: z.string().optional().nullable(),
    howToReturn: z.string().optional().nullable(),
    safetyNotes: z.string().optional().nullable(),
    interestingFacts: z.array(z.string()).optional(),
    trackGeoJson: routeTrackGeoJsonSchema.nullable(),
    trackSourceFormat: z.string().optional().nullable(),
    trackSourceFilename: z.string().optional().nullable(),
    pointsOfInterest: z.array(routePoiSchema).optional(),
    coverImageUrl: z.string().url().optional().nullable(),
    previewImageUrl: z.string().url().optional().nullable(),
    galleryImageUrls: z.array(z.string().url()).optional(),
    status: z.enum(statusValues).default("DRAFT"),
    authors: z.array(z.string()).min(1, "Нужен хотя бы один автор"),
  })
  .superRefine((data, ctx) => {
    if ((data.status === "PUBLISHED" || data.status === "REVIEW") && !data.trackGeoJson) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Для публикации нужен загруженный трек",
        path: ["trackGeoJson"],
      });
    }

    if ((data.status === "PUBLISHED" || data.status === "REVIEW") && !data.coverImageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Для публикации нужна обложка",
        path: ["coverImageUrl"],
      });
    }
  });

export type RouteEditorInput = z.input<typeof routeEditorSchema>;
export type RouteEditorData = z.output<typeof routeEditorSchema>;
type PoiInput = NonNullable<RouteEditorData["pointsOfInterest"]>[number];

type SanitizedEditorData = {
  tags: string[];
  highlights: string[];
  interestingFacts: string[];
  gallery: string[];
  points: {
    id: string;
    name: string;
    description: string | null;
    category: PoiInput["category"];
    coordinates: PoiInput["coordinates"];
  }[];
  trackProvided: boolean;
  published: boolean;
};

function sanitizeEditorData(parsed: RouteEditorData): SanitizedEditorData {
  const tags = normalizeStringArray(parsed.tags);
  const highlights = normalizeStringArray(parsed.highlights);
  const interestingFacts = normalizeStringArray(parsed.interestingFacts);
  const gallery = normalizeStringArray(parsed.galleryImageUrls);

  const points: SanitizedEditorData["points"] = [];
  const seen = new Set<string>();

  for (const poi of parsed.pointsOfInterest ?? []) {
    let id = poi.id ?? randomUUID();
    while (seen.has(id)) {
      id = randomUUID();
    }

    points.push({
      id,
      name: poi.name,
      description: poi.description ?? null,
      category: poi.category,
      coordinates: poi.coordinates,
    });
    seen.add(id);
  }

  return {
    tags,
    highlights,
    interestingFacts,
    gallery,
    points,
    trackProvided: Boolean(parsed.trackGeoJson),
    published: parsed.status === "PUBLISHED",
  };
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let attempt = 1;

  while (true) {
    const existing = await prisma.route.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

function toDecimal(value: number) {
  return new Decimal(value.toFixed(2));
}

async function setRouteAuthors(routeId: string, authorIds: string[]) {
  const unique = Array.from(new Set(authorIds));

  await prisma.routeAuthor.deleteMany({ where: { routeId } });

  await prisma.routeAuthor.createMany({
    data: unique.map((userId, index) => ({
      routeId,
      userId,
      assignedAt: new Date(Date.now() + index),
    })),
    skipDuplicates: true,
  });
}

function toRouteDetails(record: Awaited<ReturnType<typeof prisma.route.findUnique>> & {
  authors: { userId: string; user: { name: string | null; email: string } }[];
}): RouteDetails {
  if (!record) {
    throw new Error("Маршрут не найден");
  }

  type AuthorRecord = (typeof record.authors)[number];

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    city: record.city,
    region: record.region,
    difficulty: record.difficulty as RouteDifficultyValue,
    distanceKm: Number(record.distanceKm),
    durationMinutes: record.durationMinutes,
    suitableFor: record.suitableFor as RouteAudienceValue[],
    tags: record.tags,
    highlights: record.highlights,
    coverImageUrl: record.coverImageUrl,
    previewImageUrl: record.previewImageUrl,
    galleryImageUrls: record.galleryImageUrls,
    ratingAverage: record.ratingAverage ? Number(record.ratingAverage) : null,
    ratingCount: record.ratingCount,
    commentCount: record.commentCount ?? 0,
    status: record.status as RouteStatusValue,
    publishedAt: record.publishedAt ?? null,
    createdAt: record.createdAt,
    descriptionMarkdown: record.descriptionMarkdown,
    howToGet: record.howToGet,
    howToReturn: record.howToReturn,
    safetyNotes: record.safetyNotes,
    interestingFacts: record.interestingFacts,
    trackGeoJson: (record.trackGeoJson ?? null) as RouteDetails["trackGeoJson"],
    trackSourceFormat: record.trackSourceFormat,
    trackSourceFilename: record.trackSourceFilename,
    trackUpdatedAt: record.trackUpdatedAt ?? null,
    pointsOfInterest: (record.pointsOfInterest ?? []) as RouteDetails["pointsOfInterest"],
    authors: record.authors.map((author: AuthorRecord): RouteAuthorSummary => ({
      id: author.userId,
      name: author.user.name,
      email: author.user.email,
    })),
  };
}

export async function createRoute(input: RouteEditorInput, createdBy: string) {
  const parsed = routeEditorSchema.parse(input);
  const sanitized = sanitizeEditorData(parsed);

  const slug = await generateUniqueSlug(parsed.title);
  const now = new Date();
  const authors = parsed.authors.includes(createdBy) ? parsed.authors : [...parsed.authors, createdBy];

  const route = await prisma.route.create({
    data: {
      slug,
      title: parsed.title,
      summary: parsed.summary,
      city: parsed.city,
      region: parsed.region,
      difficulty: parsed.difficulty,
      distanceKm: toDecimal(parsed.distanceKm),
      durationMinutes: parsed.durationMinutes,
      suitableFor: parsed.suitableFor,
      tags: sanitized.tags,
      highlights: sanitized.highlights,
      descriptionMarkdown: parsed.descriptionMarkdown,
      howToGet: parsed.howToGet ?? null,
      howToReturn: parsed.howToReturn ?? null,
      safetyNotes: parsed.safetyNotes ?? null,
      interestingFacts: sanitized.interestingFacts,
      trackGeoJson: parsed.trackGeoJson,
      trackSourceFormat: parsed.trackSourceFormat ?? null,
      trackSourceFilename: parsed.trackSourceFilename ?? null,
      trackUpdatedAt: sanitized.trackProvided ? now : null,
      pointsOfInterest: sanitized.points,
      coverImageUrl: parsed.coverImageUrl ?? null,
      previewImageUrl: parsed.previewImageUrl ?? null,
      galleryImageUrls: sanitized.gallery,
      status: parsed.status,
      isPublished: sanitized.published,
      publishedAt: sanitized.published ? now : null,
    },
    include: {
      authors: { include: { user: true } },
    },
  });

  await setRouteAuthors(route.id, authors);

  const updated = await prisma.route.findUnique({
    where: { id: route.id },
    include: { authors: { include: { user: true } } },
  });

  return toRouteDetails(updated!);
}

export async function updateRoute(routeId: string, input: RouteEditorInput) {
  const parsed = routeEditorSchema.parse(input);
  const sanitized = sanitizeEditorData(parsed);
  const now = new Date();

  await prisma.route.update({
    where: { id: routeId },
    data: {
      title: parsed.title,
      summary: parsed.summary,
      city: parsed.city,
      region: parsed.region,
      difficulty: parsed.difficulty,
      distanceKm: toDecimal(parsed.distanceKm),
      durationMinutes: parsed.durationMinutes,
      suitableFor: parsed.suitableFor,
      tags: sanitized.tags,
      highlights: sanitized.highlights,
      descriptionMarkdown: parsed.descriptionMarkdown,
      howToGet: parsed.howToGet ?? null,
      howToReturn: parsed.howToReturn ?? null,
      safetyNotes: parsed.safetyNotes ?? null,
      interestingFacts: sanitized.interestingFacts,
      trackGeoJson: parsed.trackGeoJson,
      trackSourceFormat: parsed.trackSourceFormat ?? null,
      trackSourceFilename: parsed.trackSourceFilename ?? null,
      trackUpdatedAt: sanitized.trackProvided ? now : null,
      pointsOfInterest: sanitized.points,
      coverImageUrl: parsed.coverImageUrl ?? null,
      previewImageUrl: parsed.previewImageUrl ?? null,
      galleryImageUrls: sanitized.gallery,
      status: parsed.status,
      isPublished: sanitized.published,
      publishedAt: sanitized.published ? now : null,
    },
  });

  await setRouteAuthors(routeId, parsed.authors);

  return getRouteForAdmin(routeId);
}

export async function listRoutesForAdmin(limit = 50) {
  const routes = await prisma.route.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      authors: { include: { user: true } },
    },
  });

  type RouteRecord = (typeof routes)[number];

  return routes.map((route: RouteRecord): RouteDetails => toRouteDetails(route));
}

export async function getRouteForAdmin(routeId: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: { authors: { include: { user: true } } },
  });

  if (!route) {
    throw new Error("Маршрут не найден");
  }

  return toRouteDetails(route);
}

export async function updateRouteStatus(routeId: string, status: RouteStatusValue) {
  const published = status === "PUBLISHED";
  await prisma.route.update({
    where: { id: routeId },
    data: {
      status,
      isPublished: published,
      publishedAt: published ? new Date() : null,
    },
  });

  return getRouteForAdmin(routeId);
}

export async function replaceRouteAuthors(routeId: string, authorIds: string[]) {
  await setRouteAuthors(routeId, authorIds);
  return getRouteForAdmin(routeId);
}
