import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { getNotificationsForUser, markNotificationsAsRead } from "@/lib/social/notifications";
import type { NotificationView } from "@/lib/social/types";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Уведомления",
  description: "Последние действия сообщества и модерации",
};

function renderNotification(notification: NotificationView) {
  const { type, data, createdAt } = notification;
  const createdLabel = formatDateTime(new Date(createdAt));
  const routeSlug = typeof data.routeSlug === "string" ? data.routeSlug : null;
  const routeTitle = typeof data.routeTitle === "string" ? data.routeTitle : "Маршрут";
  const commentId = typeof data.commentId === "string" ? data.commentId : null;

  switch (type) {
    case "ROUTE_COMMENT":
      return {
        title: "Новый комментарий к вашему маршруту",
        description: `${data.authorName ?? "Пользователь"} оставил комментарий к «${routeTitle}».`,
        href: routeSlug ? `/catalog/${routeSlug}${commentId ? `#comment-${commentId}` : ""}` : null,
        createdLabel,
      };
    case "COMMENT_REPLY":
      return {
        title: "Новый ответ на комментарий",
        description: `${data.authorName ?? "Пользователь"} ответил в обсуждении «${routeTitle}».`,
        href: routeSlug ? `/catalog/${routeSlug}${commentId ? `#comment-${commentId}` : ""}` : null,
        createdLabel,
      };
    case "ROUTE_RATING":
      return {
        title: "Новая оценка маршрута",
        description: `Кто-то оценил «${routeTitle}» на ${data.value ?? "?"}★.`,
        href: routeSlug ? `/catalog/${routeSlug}` : null,
        createdLabel,
      };
    case "COMMENT_FLAGGED":
      return {
        title: "Комментарий отправлен на модерацию",
        description: "Модератор проверяет ваш комментарий или он получил жалобу.",
        href: routeSlug ? `/catalog/${routeSlug}${commentId ? `#comment-${commentId}` : ""}` : null,
        createdLabel,
      };
    default:
      return {
        title: "Уведомление",
        description: "В системе появилось новое событие.",
        href: routeSlug ? `/catalog/${routeSlug}` : null,
        createdLabel,
      };
  }
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotificationsForUser(user.id, 100);
  if (notifications.some((item) => !item.readAt)) {
    await markNotificationsAsRead(user.id);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Уведомления</h1>
        <p className="text-sm text-muted-foreground">
          Здесь появляются новые комментарии, ответы и уведомления модерации по вашим маршрутам и обсуждениям.
        </p>
      </header>

      {notifications.length ? (
        <ul className="space-y-4">
          {notifications.map((notification) => {
            const { title, description, href, createdLabel } = renderNotification(notification);
            return (
              <li
                key={notification.id}
                className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-lg"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <span className="text-xs text-muted-foreground">{createdLabel}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  {href ? (
                    <Link href={href} className="text-sm font-medium text-primary hover:underline">
                      Перейти к событию
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground">
          Пока уведомлений нет. Как только появятся новые комментарии или оценки, мы сообщим вам здесь.
        </div>
      )}
    </div>
  );
}
