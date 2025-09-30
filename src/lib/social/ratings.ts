import { prisma } from "@/lib/prisma";
import { createNotificationsForUsers } from "./notifications";
import type { RouteRatingStats, RouteRatingValue } from "./types";

const RATING_VALUES: RouteRatingValue[] = [1, 2, 3, 4, 5];

function assertRatingValue(value: number): asserts value is RouteRatingValue {
  if (!RATING_VALUES.includes(value as RouteRatingValue)) {
    throw new Error("Оценка должна быть от 1 до 5");
  }
}

function emptyDistribution(): Record<RouteRatingValue, number> {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
}

async function recalculateRouteRating(routeId: string): Promise<void> {
  const aggregate = await prisma.routeRating.aggregate({
    where: { routeId },
    _avg: { value: true },
    _count: { value: true },
  });

  await prisma.route.update({
    where: { id: routeId },
    data: {
      ratingAverage: aggregate._avg.value ?? null,
      ratingCount: aggregate._count.value,
    },
  });
}

async function notifyRouteAuthorsAboutRating(routeId: string, userId: string, value: RouteRatingValue) {
  const [route, authors] = await Promise.all([
    prisma.route.findUnique({ where: { id: routeId }, select: { slug: true, title: true } }),
    prisma.routeAuthor.findMany({ where: { routeId }, select: { userId: true } }),
  ]);

  if (!route || !authors.length) {
    return;
  }

  const recipientIds = authors
    .map((author: (typeof authors)[number]) => author.userId)
    .filter((id: string) => id !== userId);
  if (!recipientIds.length) {
    return;
  }

  await createNotificationsForUsers(recipientIds, "ROUTE_RATING", {
    routeId,
    routeSlug: route.slug,
    routeTitle: route.title,
    value,
  });
}

export async function getRouteRatingStats(
  routeId: string,
  viewerId: string | null,
): Promise<RouteRatingStats> {
  const [route, distributionRows, viewerRating] = await Promise.all([
    prisma.route.findUnique({
      where: { id: routeId },
      select: { ratingAverage: true, ratingCount: true },
    }),
    prisma.routeRating.groupBy({
      by: ["value"],
      where: { routeId },
      _count: { value: true },
    }),
    viewerId
      ? prisma.routeRating.findUnique({
          where: { routeId_userId: { routeId, userId: viewerId } },
          select: { value: true },
        })
      : Promise.resolve(null),
  ]);

  const distribution = emptyDistribution();
  for (const row of distributionRows) {
    const rating = row.value as RouteRatingValue;
    distribution[rating] = row._count.value;
  }

  return {
    average: route?.ratingAverage ? Number(route.ratingAverage) : null,
    count: route?.ratingCount ?? 0,
    distribution,
    viewerValue: viewerRating?.value ? (viewerRating.value as RouteRatingValue) : null,
  };
}

export async function setRouteRating(
  routeId: string,
  userId: string,
  value: number,
): Promise<RouteRatingStats> {
  assertRatingValue(value);

  const existing = await prisma.routeRating.findUnique({
    where: { routeId_userId: { routeId, userId } },
    select: { id: true, value: true },
  });

  await prisma.routeRating.upsert({
    where: { routeId_userId: { routeId, userId } },
    update: { value, updatedAt: new Date() },
    create: { routeId, userId, value },
  });

  await recalculateRouteRating(routeId);

  if (!existing || existing.value !== value) {
    await notifyRouteAuthorsAboutRating(routeId, userId, value as RouteRatingValue);
  }

  return getRouteRatingStats(routeId, userId);
}
