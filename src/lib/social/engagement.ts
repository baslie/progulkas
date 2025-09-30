import { prisma } from "@/lib/prisma";
import {
  createRouteComment,
  flagRouteComment,
  getCommentsModerationQueue,
  getRouteCommentsSnapshot,
  type CreateCommentInput,
  updateRouteCommentStatus,
} from "./comments";
import { getRouteRatingStats, setRouteRating } from "./ratings";
import type { RouteEngagementSnapshot } from "./types";
import type { AuditLogContext } from "@/lib/admin/audit-log";

export async function getPublishedRouteBySlug(slug: string) {
  const route = await prisma.route.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      ratingAverage: true,
      ratingCount: true,
      commentCount: true,
    },
  });

  if (!route) {
    throw new Error("Маршрут не найден или не опубликован");
  }

  return route;
}

export async function getRouteEngagementSnapshot(
  slug: string,
  viewerId: string | null,
): Promise<RouteEngagementSnapshot> {
  const route = await getPublishedRouteBySlug(slug);
  const [rating, comments] = await Promise.all([
    getRouteRatingStats(route.id, viewerId),
    getRouteCommentsSnapshot(route.id, viewerId, route.commentCount ?? undefined),
  ]);

  return {
    rating,
    comments,
  };
}

export async function setRouteRatingForSlug(slug: string, userId: string, value: number) {
  const route = await getPublishedRouteBySlug(slug);
  return setRouteRating(route.id, userId, value);
}

export async function createCommentForSlug(
  slug: string,
  input: Omit<CreateCommentInput, "routeId">,
) {
  const route = await getPublishedRouteBySlug(slug);
  await createRouteComment({ routeId: route.id, ...input });
}

export async function flagCommentForSlug(slug: string, commentId: string, userId: string) {
  await getPublishedRouteBySlug(slug);
  await flagRouteComment(commentId, userId);
}

export async function moderateComment(
  commentId: string,
  status: "PUBLISHED" | "PENDING" | "REJECTED" | "HIDDEN",
  moderatorId: string,
  context?: AuditLogContext,
) {
  await updateRouteCommentStatus(commentId, status, moderatorId, context);
}

export async function getModerationQueue(limit?: number) {
  return getCommentsModerationQueue(limit);
}
