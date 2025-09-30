import { CommentsModerationPanel } from "@/components/admin/comments/comments-moderation-panel";
import { requireAdmin } from "@/lib/auth/session";
import { getModerationQueue } from "@/lib/social/engagement";

export default async function CommentsAdminPage() {
  await requireAdmin();
  const queue = await getModerationQueue();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Комментарии</h1>
        <p className="text-sm text-muted-foreground">
          Управляйте жалобами и автоматически задержанными комментариями. Одобренные сообщения сразу появятся на странице
          маршрута.
        </p>
      </header>

      <CommentsModerationPanel initial={queue} />
    </div>
  );
}
