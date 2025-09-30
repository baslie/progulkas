const ACTION_LABELS: Record<string, string> = {
  "route.create": "Создание маршрута",
  "route.update": "Обновление маршрута",
  "comment.moderate": "Модерация комментария",
};

const MAX_TEXT_LENGTH = 500;

export function truncateText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.length > MAX_TEXT_LENGTH ? value.slice(0, MAX_TEXT_LENGTH) : value;
}

export function describeAuditAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(metadata, (_key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }

        if (typeof value === "bigint") {
          return value.toString();
        }

        return value;
      }),
    );
  } catch (error) {
    console.error("[audit] Не удалось сериализовать метаданные", error);
    return null;
  }
}
