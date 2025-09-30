import { prisma } from "@/lib/prisma";
import { describeAuditAction, sanitizeAuditMetadata, truncateText } from "./audit-log-helpers";

export type AuditLogContext = {
  actorEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type RecordAuditLogInput = AuditLogContext & {
  action: string;
  entity?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  label: string;
  actorId: string | null;
  actorEmail: string | null;
  entity: string | null;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? null,
        actorEmail: truncateText(input.actorEmail ?? null),
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        ipAddress: truncateText(input.ipAddress ?? null),
        userAgent: truncateText(input.userAgent ?? null),
        metadata: sanitizeAuditMetadata(input.metadata) ?? undefined,
      },
    });
  } catch (error) {
    console.error("[audit] Ошибка записи события", error);
  }
}

export async function listAuditLogEntries(limit = 50): Promise<AuditLogEntry[]> {
  const records = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map((record: (typeof records)[number]) => ({
    id: record.id,
    action: record.action,
    label: describeAuditAction(record.action),
    actorId: record.actorId ?? null,
    actorEmail: record.actorEmail ?? null,
    entity: record.entity ?? null,
    entityId: record.entityId ?? null,
    ipAddress: record.ipAddress ?? null,
    userAgent: record.userAgent ?? null,
    metadata: (record.metadata ?? null) as Record<string, unknown> | null,
    createdAt: record.createdAt.toISOString(),
  }));
}
