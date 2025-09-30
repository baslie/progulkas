import { prisma } from "@/lib/prisma";
import { recordAuditLog, type AuditLogContext } from "@/lib/admin/audit-log";
import { calculateSpamScore, isLikelySpam, normalizeCommentContent } from "./anti-spam";
import { createNotification, createNotificationsForUsers, notifyAdmins } from "./notifications";
import type {
  RouteCommentNode,
  RouteCommentsSnapshot,
  RouteCommentStatus,
  NotificationType,
} from "./types";

const PUBLISH_STATUS: RouteCommentStatus = "PUBLISHED";
const PENDING_STATUS: RouteCommentStatus = "PENDING";
const HIDDEN_STATUSES: RouteCommentStatus[] = ["REJECTED", "HIDDEN"];

function toNode(
  record: Awaited<ReturnType<typeof prisma.routeComment.findMany>>[number],
  viewerId: string | null,
): RouteCommentNode {
  return {
    id: record.id,
    routeId: record.routeId,
    parentId: record.parentId ?? null,
    content: record.content,
    status: record.status as RouteCommentStatus,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    spamScore: record.spamScore,
    isFlagged: record.isFlagged,
    isOwn: viewerId === record.authorId,
    author: {
      id: record.authorId,
      name: record.author.name,
      email: record.author.email,
    },
    children: [],
  };
}

function buildTree(records: Awaited<ReturnType<typeof prisma.routeComment.findMany>>, viewerId: string | null) {
  const nodes = new Map<string, RouteCommentNode>();
  const roots: RouteCommentNode[] = [];

  for (const record of records) {
    nodes.set(record.id, toNode(record, viewerId));
  }

  for (const record of records) {
    const node = nodes.get(record.id)!;
    if (record.parentId && nodes.has(record.parentId)) {
      nodes.get(record.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (items: RouteCommentNode[]) => {
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    for (const item of items) {
      if (item.children.length) {
        sortRecursive(item.children);
      }
    }
  };

  sortRecursive(roots);
  return roots;
}

async function recalculateRouteCommentCount(routeId: string): Promise<number> {
  const count = await prisma.routeComment.count({
    where: { routeId, status: PUBLISH_STATUS },
  });

  await prisma.route.update({
    where: { id: routeId },
    data: { commentCount: count },
  });

  return count;
}

async function notifyCommentPublished(commentId: string, notificationType: NotificationType): Promise<void> {
  const comment = await prisma.routeComment.findUnique({
    where: { id: commentId },
    include: {
      route: {
        select: {
          id: true,
          slug: true,
          title: true,
          authors: true,
        },
      },
      author: {
        select: { id: true, name: true, email: true },
      },
      parent: {
        include: {
          author: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!comment) {
    return;
  }

  const recipients = new Set<string>();
  for (const author of comment.route.authors) {
    recipients.add(author.userId);
  }

  if (comment.parent?.authorId) {
    recipients.add(comment.parent.authorId);
  }

  recipients.delete(comment.authorId);

  if (!recipients.size) {
    return;
  }

  await createNotificationsForUsers(Array.from(recipients), notificationType, {
    routeId: comment.routeId,
    routeSlug: comment.route.slug,
    routeTitle: comment.route.title,
    commentId: comment.id,
    parentId: comment.parentId,
    authorId: comment.author.id,
    authorName: comment.author.name ?? comment.author.email,
  });
}

export async function getRouteCommentsSnapshot(
  routeId: string,
  viewerId: string | null,
  publishedCount?: number,
): Promise<RouteCommentsSnapshot> {
  const [records, totalPublished] = await Promise.all([
    prisma.routeComment.findMany({
      where: {
        routeId,
        OR: viewerId
          ? [{ status: PUBLISH_STATUS }, { authorId: viewerId }]
          : [{ status: PUBLISH_STATUS }],
      },
      include: {
        author: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    typeof publishedCount === "number"
      ? Promise.resolve(publishedCount)
      : prisma.routeComment.count({ where: { routeId, status: PUBLISH_STATUS } }),
  ]);

  return {
    totalPublished,
    tree: buildTree(records, viewerId),
  };
}

export type CreateCommentInput = {
  routeId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
};

export async function createRouteComment({ routeId, authorId, content, parentId }: CreateCommentInput) {
  const sanitized = normalizeCommentContent(content);
  if (sanitized.length < 10) {
    throw new Error("Комментарий должен содержать не менее 10 символов");
  }

  if (sanitized.length > 2000) {
    throw new Error("Комментарий не может превышать 2000 символов");
  }

  let parentCommentId: string | null = null;
  if (parentId) {
    const parentComment = await prisma.routeComment.findUnique({
      where: { id: parentId },
      select: { id: true, routeId: true, status: true },
    });

    if (!parentComment || parentComment.routeId !== routeId) {
      throw new Error("Родительский комментарий не найден");
    }

    parentCommentId = parentComment.id;
  }

  const spamScore = calculateSpamScore(sanitized);
  const flagged = isLikelySpam(sanitized);
  const status: RouteCommentStatus = flagged ? PENDING_STATUS : PUBLISH_STATUS;

  const comment = await prisma.routeComment.create({
    data: {
      routeId,
      authorId,
      parentId: parentCommentId,
      content: sanitized,
      status,
      spamScore,
      isFlagged: flagged,
    },
    include: {
      author: true,
    },
  });

  if (status === PUBLISH_STATUS) {
    await recalculateRouteCommentCount(routeId);
    await notifyCommentPublished(comment.id, parentId ? "COMMENT_REPLY" : "ROUTE_COMMENT");
  } else {
    await notifyAdmins("COMMENT_FLAGGED", {
      routeId,
      commentId: comment.id,
      spamScore,
    });
  }

  return comment;
}

export async function flagRouteComment(commentId: string, flaggedBy: string): Promise<void> {
  const comment = await prisma.routeComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return;
  }

  if (comment.authorId === flaggedBy) {
    return;
  }

  if (comment.isFlagged) {
    return;
  }

  await prisma.routeComment.update({
    where: { id: commentId },
    data: {
      isFlagged: true,
    },
  });

  await notifyAdmins("COMMENT_FLAGGED", {
    routeId: comment.routeId,
    commentId,
    reason: "user_flag",
  });
}

export async function updateRouteCommentStatus(
  commentId: string,
  status: RouteCommentStatus,
  moderatorId: string,
  context?: AuditLogContext,
): Promise<void> {
  if (![PUBLISH_STATUS, PENDING_STATUS, ...HIDDEN_STATUSES].includes(status)) {
    throw new Error("Недопустимый статус комментария");
  }

  const existing = await prisma.routeComment.findUnique({
    where: { id: commentId },
  });

  if (!existing) {
    throw new Error("Комментарий не найден");
  }

  if (existing.status === status && (!existing.isFlagged || status !== PUBLISH_STATUS)) {
    return;
  }

  await prisma.routeComment.update({
    where: { id: commentId },
    data: {
      status,
      isFlagged: status === PUBLISH_STATUS ? false : existing.isFlagged,
    },
  });

  await recalculateRouteCommentCount(existing.routeId);

  if (status === PUBLISH_STATUS) {
    await notifyCommentPublished(commentId, existing.parentId ? "COMMENT_REPLY" : "ROUTE_COMMENT");
  } else if (status === "REJECTED" || status === "HIDDEN") {
    await createNotification(existing.authorId, "COMMENT_FLAGGED", {
      commentId,
      routeId: existing.routeId,
      status,
      moderatorId,
    });
  }

  await recordAuditLog({
    action: "comment.moderate",
    entity: "route_comment",
    entityId: commentId,
    actorId: moderatorId,
    actorEmail: context?.actorEmail ?? null,
    ipAddress: context?.ipAddress ?? null,
    userAgent: context?.userAgent ?? null,
    metadata: {
      routeId: existing.routeId,
      previousStatus: existing.status,
      newStatus: status,
      wasFlagged: existing.isFlagged,
    },
  });
}

export type ModerationQueueItem = {
  id: string;
  routeId: string;
  routeTitle: string;
  routeSlug: string;
  authorName: string | null;
  authorEmail: string;
  status: RouteCommentStatus;
  content: string;
  spamScore: number;
  isFlagged: boolean;
  parentId: string | null;
  createdAt: string;
};

export async function getCommentsModerationQueue(limit = 50): Promise<ModerationQueueItem[]> {
  const records = await prisma.routeComment.findMany({
    where: {
      OR: [
        { status: { in: [PENDING_STATUS, "REJECTED"] as RouteCommentStatus[] } },
        { isFlagged: true },
      ],
    },
    include: {
      route: {
        select: { id: true, title: true, slug: true },
      },
      author: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map((record: (typeof records)[number]) => ({
    id: record.id,
    routeId: record.routeId,
    routeTitle: record.route.title,
    routeSlug: record.route.slug,
    authorName: record.author.name,
    authorEmail: record.author.email,
    status: record.status as RouteCommentStatus,
    content: record.content,
    spamScore: record.spamScore,
    isFlagged: record.isFlagged,
    parentId: record.parentId ?? null,
    createdAt: record.createdAt.toISOString(),
  }));
}
