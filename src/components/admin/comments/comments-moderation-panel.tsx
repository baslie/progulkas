"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldX } from "lucide-react";

import type { ModerationQueueItem } from "@/lib/social/comments";
import { Button } from "@/components/ui/button";

async function fetchQueue(): Promise<ModerationQueueItem[]> {
  const response = await fetch("/api/admin/comments", { cache: "no-store" });
  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? "Не удалось получить очередь модерации");
  }
  return json.data as ModerationQueueItem[];
}

type ActionPayload = {
  commentId: string;
  status: "PUBLISHED" | "PENDING" | "REJECTED" | "HIDDEN";
};

async function moderateCommentRequest({ commentId, status }: ActionPayload) {
  const response = await fetch(`/api/admin/comments/${commentId}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? "Не удалось обновить комментарий");
  }
}

export function CommentsModerationPanel({ initial }: { initial: ModerationQueueItem[] }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: fetchQueue,
    initialData: initial,
  });

  const mutation = useMutation({
    mutationFn: moderateCommentRequest,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<ModerationQueueItem[]>(["admin-comments"], (previous = []) =>
        previous.filter((item) => item.id !== variables.commentId),
      );
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загружаем очередь модерации...</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">{(error as Error)?.message ?? "Ошибка загрузки"}</p>;
  }

  if (!data.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
        Очередь модерации пуста — все комментарии проверены.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {data.map((item) => (
        <li
          key={item.id}
          className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-lg"
        >
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Комментарий к «{item.routeTitle}»</h3>
              <p className="text-xs text-muted-foreground">{item.authorName ?? item.authorEmail}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Статус: {item.status}
            </span>
          </header>
          <p className="text-sm leading-relaxed text-foreground">{item.content}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Спам-оценка: {item.spamScore.toFixed(2)}</span>
            {item.isFlagged ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                <ShieldX className="h-3 w-3" aria-hidden /> Жалоба от пользователей
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                <ShieldCheck className="h-3 w-3" aria-hidden /> Без жалоб
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => mutation.mutate({ commentId: item.id, status: "PUBLISHED" })}
              disabled={mutation.isPending}
            >
              Опубликовать
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => mutation.mutate({ commentId: item.id, status: "REJECTED" })}
              disabled={mutation.isPending}
            >
              Отклонить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => mutation.mutate({ commentId: item.id, status: "HIDDEN" })}
              disabled={mutation.isPending}
            >
              Скрыть
            </Button>
          </div>
          {mutation.isError ? (
            <p className="text-xs text-destructive">{(mutation.error as Error).message}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
