import { prisma } from "@/lib/prisma";
import type { NotificationType, NotificationView } from "./types";

function deduplicateIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

async function getRoleUserIds(roleName: string): Promise<string[]> {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: {
      users: true,
    },
  });

  if (!role) {
    return [];
  }

  return role.users.map((item: (typeof role.users)[number]) => item.userId);
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, unknown>,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type,
      data,
    },
  });
}

export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  data: Record<string, unknown>,
): Promise<void> {
  const uniqueIds = deduplicateIds(userIds);
  if (!uniqueIds.length) {
    return;
  }

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      type,
      data,
    })),
  });
}

export async function notifyAdmins(
  type: NotificationType,
  data: Record<string, unknown>,
): Promise<void> {
  const adminIds = await getRoleUserIds("admin");
  if (!adminIds.length) {
    return;
  }

  await createNotificationsForUsers(adminIds, type, data);
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

export async function getNotificationsForUser(
  userId: string,
  limit = 50,
): Promise<NotificationView[]> {
  const records = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map((record: (typeof records)[number]) => ({
    id: record.id,
    type: record.type as NotificationType,
    data: (record.data ?? {}) as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    readAt: record.readAt ? record.readAt.toISOString() : null,
  }));
}

export async function markNotificationsAsRead(
  userId: string,
  notificationIds?: string[],
): Promise<void> {
  const where = notificationIds?.length
    ? {
        id: { in: deduplicateIds(notificationIds) },
        userId,
        readAt: null,
      }
    : {
        userId,
        readAt: null,
      };

  await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });
}
