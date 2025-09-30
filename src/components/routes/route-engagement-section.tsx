"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, MessageCircle, Flag } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { RouteEngagementSnapshot, RouteCommentNode, RouteRatingValue } from "@/lib/social/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";

function fetchEngagement(slug: string) {
  return async (): Promise<RouteEngagementSnapshot> => {
    const response = await fetch(`/api/routes/${slug}/engagement`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(json.error ?? "Не удалось загрузить данные");
    }
    return json.data as RouteEngagementSnapshot;
  };
}

function ratingLabel(value: RouteRatingValue): string {
  switch (value) {
    case 5:
      return "Отлично";
    case 4:
      return "Хорошо";
    case 3:
      return "Нормально";
    case 2:
      return "Так себе";
    default:
      return "Плохо";
  }
}

type RatingControlProps = {
  slug: string;
  ratingAverage: number | null;
  ratingCount: number;
  distribution: RouteEngagementSnapshot["rating"]["distribution"];
  viewerValue: RouteRatingValue | null;
  isAuthenticated: boolean;
};

function RatingControl({ slug, ratingAverage, ratingCount, distribution, viewerValue, isAuthenticated }: RatingControlProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (value: RouteRatingValue) => {
      const response = await fetch(`/api/routes/${slug}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Не удалось сохранить оценку");
      }
      return json.data as RouteEngagementSnapshot["rating"];
    },
    onSuccess: (data) => {
      queryClient.setQueryData<RouteEngagementSnapshot | undefined>(["route-engagement", slug], (prev) =>
        prev ? { ...prev, rating: data } : prev,
      );
    },
  });

  const currentStats = mutation.data ?? {
    average: ratingAverage,
    count: ratingCount,
    distribution,
    viewerValue,
  };
  const averageText = currentStats.average ? currentStats.average.toFixed(1) : "—";
  const hint = currentStats.viewerValue ? `Ваша оценка: ${currentStats.viewerValue}` : "Поставьте оценку маршруту";

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Рейтинг маршрута</p>
          <p className="text-3xl font-semibold text-foreground">{averageText}</p>
          <p className="text-xs text-muted-foreground">{currentStats.count} оценок</p>
        </div>
        <div className="flex items-center gap-1 text-amber-500" aria-label={hint}>
          {[1, 2, 3, 4, 5].map((value) => {
            const active = currentStats.viewerValue
              ? value <= currentStats.viewerValue
              : currentStats.average
                ? value <= Math.round(currentStats.average)
                : false;
            return (
              <button
                key={value}
                type="button"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition",
                  active ? "border-amber-400 bg-amber-500/20" : "border-border bg-background",
                  mutation.isPending ? "pointer-events-none opacity-70" : "hover:border-amber-300 hover:bg-amber-100/20",
                )}
                onClick={() => mutation.mutate(value as RouteRatingValue)}
                disabled={!isAuthenticated}
              >
                <Star className={cn("h-5 w-5", active ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} aria-hidden />
                <span className="sr-only">{ratingLabel(value as RouteRatingValue)}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!isAuthenticated ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/auth/sign-in" className="underline">
            Войдите
          </Link>
          , чтобы поставить оценку маршруту.
        </p>
      ) : viewerValue ? (
        <p className="text-sm text-muted-foreground">Спасибо за вашу оценку!</p>
      ) : (
        <p className="text-sm text-muted-foreground">Поделитесь впечатлением: оценка помогает авторам улучшать маршруты.</p>
      )}
      {mutation.isError ? (
        <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
      ) : null}
      <div className="space-y-2 text-xs text-muted-foreground">
        {([5, 4, 3, 2, 1] as RouteRatingValue[]).map((value) => (
          <div key={value} className="flex items-center gap-2">
            <span className="w-16 text-right font-medium">{value}★</span>
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{
                  width: currentStats.count
                    ? `${Math.round((100 * (currentStats.distribution?.[value] ?? 0)) / currentStats.count)}%`
                    : "0%",
                }}
              />
            </div>
            <span className="w-10 text-right">{currentStats.distribution?.[value] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentForm({
  onSubmit,
  disabled,
  placeholder,
}: {
  onSubmit: (content: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) {
          return;
        }
        onSubmit(value);
        setValue("");
      }}
      className="space-y-3"
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? "Поделитесь впечатлениями"}
        minLength={10}
        maxLength={2000}
        required
        disabled={disabled}
        className="min-h-[120px]"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || !value.trim()}>
          Отправить
        </Button>
      </div>
    </form>
  );
}

type CommentListProps = {
  nodes: RouteCommentNode[];
  onReply: (parentId: string, content: string) => void;
  onFlag: (commentId: string) => Promise<void>;
  isAuthenticated: boolean;
  isSubmitting: boolean;
};

function CommentList({ nodes, onReply, onFlag, isAuthenticated, isSubmitting }: CommentListProps) {
  if (!nodes.length) {
    return <p className="text-sm text-muted-foreground">Комментариев пока нет — станьте первым!</p>;
  }

  return (
    <ul className="space-y-6">
      {nodes.map((node) => (
        <CommentItem
          key={node.id}
          node={node}
          onReply={onReply}
          onFlag={onFlag}
          isAuthenticated={isAuthenticated}
          isSubmitting={isSubmitting}
        />
      ))}
    </ul>
  );
}

type CommentItemProps = {
  node: RouteCommentNode;
  onReply: (parentId: string, content: string) => void;
  onFlag: (commentId: string) => Promise<void>;
  isAuthenticated: boolean;
  isSubmitting: boolean;
};

function CommentItem({ node, onReply, onFlag, isAuthenticated, isSubmitting }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const createdAt = useMemo(() => formatDateTime(new Date(node.createdAt)), [node.createdAt]);

  const pendingLabel = node.status !== "PUBLISHED" ? "Комментарий ожидает модерации" : null;

  return (
    <li className="space-y-4" id={`comment-${node.id}`}>
      <article className="space-y-3 rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{node.author.name ?? node.author.email}</p>
            <p className="text-xs text-muted-foreground">{createdAt}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageCircle className="h-4 w-4" aria-hidden />
            {node.isOwn ? "Ваш комментарий" : "Комментарий"}
          </div>
        </header>
        <p className="text-sm leading-relaxed text-foreground">{node.content}</p>
        {pendingLabel ? (
          <p className="text-xs text-amber-600">{pendingLabel}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setIsReplying((state) => !state)}
              className="font-medium text-primary transition hover:underline"
              disabled={isSubmitting}
            >
              Ответить
            </button>
          ) : (
            <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
              Войти, чтобы ответить
            </Link>
          )}
          {!node.isOwn && node.status === "PUBLISHED" ? (
            <button
              type="button"
              onClick={async () => {
                if (flagged) {
                  return;
                }
                await onFlag(node.id);
                setFlagged(true);
              }}
              className="inline-flex items-center gap-1 text-red-500 hover:underline"
              disabled={flagged || isSubmitting}
            >
              <Flag className="h-3.5 w-3.5" aria-hidden />
              {flagged ? "Жалоба отправлена" : "Пожаловаться"}
            </button>
          ) : null}
        </div>
        {isReplying ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/80 p-3">
            <CommentForm
              onSubmit={(content) => {
                onReply(node.id, content);
                setIsReplying(false);
              }}
              disabled={!isAuthenticated || isSubmitting}
              placeholder="Напишите ответ"
            />
          </div>
        ) : null}
      </article>
      {node.children.length ? (
        <div className="space-y-4 border-l border-border/60 pl-4">
          <CommentList
            nodes={node.children}
            onReply={onReply}
            onFlag={onFlag}
            isAuthenticated={isAuthenticated}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : null}
    </li>
  );
}

type RouteEngagementSectionProps = {
  slug: string;
};

export function RouteEngagementSection({ slug }: RouteEngagementSectionProps) {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user?.id);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["route-engagement", slug],
    queryFn: fetchEngagement(slug),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId: string | null }) => {
      const response = await fetch(`/api/routes/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Не удалось сохранить комментарий");
      }
      return json.data as RouteEngagementSnapshot;
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(["route-engagement", slug], snapshot);
    },
  });

  const flagMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/routes/${slug}/comments/${commentId}/flag`, { method: "POST" });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Не удалось отправить жалобу");
      }
    },
  });

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Загружаем отзывы и рейтинг...</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6">
        <p className="text-sm text-destructive">{(error as Error)?.message ?? "Не удалось загрузить данные"}</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-3xl border border-border bg-card/70 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground">Комментарии</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {data.comments.totalPublished} опубликованных
            </span>
          </div>
          {isAuthenticated ? (
            <CommentForm
              onSubmit={(content) => commentMutation.mutate({ content, parentId: null })}
              disabled={commentMutation.isPending}
              placeholder="Расскажите о состоянии маршрута и советах"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
                Войдите
              </Link>
              , чтобы оставить комментарий и следить за ответами.
            </div>
          )}
          {commentMutation.isError ? (
            <p className="text-sm text-destructive">{(commentMutation.error as Error).message}</p>
          ) : null}
          {flagMutation.isError ? (
            <p className="text-sm text-destructive">{(flagMutation.error as Error).message}</p>
          ) : null}
          <CommentList
            nodes={data.comments.tree}
            onReply={(parentId, content) => commentMutation.mutate({ content, parentId })}
            onFlag={(commentId) => flagMutation.mutateAsync(commentId)}
            isAuthenticated={isAuthenticated}
            isSubmitting={commentMutation.isPending || flagMutation.isPending}
          />
        </div>
        <RatingControl
          slug={slug}
          ratingAverage={data.rating.average}
          ratingCount={data.rating.count}
          distribution={data.rating.distribution}
          viewerValue={data.rating.viewerValue}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </section>
  );
}
