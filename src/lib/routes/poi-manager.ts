import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { RoutePointOfInterest } from "@/lib/routes/types";

function normalizePoints(raw: unknown): RoutePointOfInterest[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized: RoutePointOfInterest[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Partial<RoutePointOfInterest> & { coordinates?: unknown };
    if (typeof record.id !== "string" || typeof record.name !== "string" || typeof record.category !== "string") {
      continue;
    }

    if (
      !Array.isArray(record.coordinates) ||
      record.coordinates.length < 2 ||
      typeof record.coordinates[0] !== "number" ||
      typeof record.coordinates[1] !== "number"
    ) {
      continue;
    }

    normalized.push({
      id: record.id,
      name: record.name,
      description: typeof record.description === "string" ? record.description : null,
      category: record.category as RoutePointOfInterest["category"],
      coordinates: [record.coordinates[0], record.coordinates[1]] as [number, number],
    });
  }

  return normalized;
}

async function getRoutePoints(routeId: string): Promise<RoutePointOfInterest[]> {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { pointsOfInterest: true },
  });

  return normalizePoints(route?.pointsOfInterest ?? []);
}

async function savePoints(routeId: string, points: RoutePointOfInterest[]) {
  await prisma.route.update({
    where: { id: routeId },
    data: { pointsOfInterest: points },
  });
}

export async function listRoutePoints(routeId: string): Promise<RoutePointOfInterest[]> {
  return getRoutePoints(routeId);
}

export type CreatePoiInput = Omit<RoutePointOfInterest, "id"> & { id?: string };

export async function createPoi(routeId: string, input: CreatePoiInput) {
  const points = await getRoutePoints(routeId);
  const id = input.id ?? randomUUID();
  const poi: RoutePointOfInterest = {
    id,
    name: input.name,
    description: input.description ?? null,
    category: input.category,
    coordinates: input.coordinates,
  };

  await savePoints(routeId, [...points.filter((point) => point.id !== id), poi]);
  return poi;
}

export type UpdatePoiInput = Partial<Omit<RoutePointOfInterest, "id">>;

export async function updatePoi(routeId: string, poiId: string, input: UpdatePoiInput) {
  const points = await getRoutePoints(routeId);
  const index = points.findIndex((point) => point.id === poiId);

  if (index === -1) {
    throw new Error("Точка интереса не найдена");
  }

  const updated: RoutePointOfInterest = {
    ...points[index],
    ...input,
    coordinates: input.coordinates ?? points[index].coordinates,
  };

  const next = [...points];
  next.splice(index, 1, updated);
  await savePoints(routeId, next);
  return updated;
}

export async function deletePoi(routeId: string, poiId: string) {
  const points = await getRoutePoints(routeId);
  const next = points.filter((point) => point.id !== poiId);

  if (next.length === points.length) {
    throw new Error("Точка интереса не найдена");
  }

  await savePoints(routeId, next);
  return { success: true };
}
