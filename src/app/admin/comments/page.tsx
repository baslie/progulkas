import { requireAdmin } from "@/lib/auth/session";

export default async function CommentsAdminPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Комментарии</h1>
        <p className="text-sm text-muted-foreground">
          Модерация комментариев появится после внедрения социальной функциональности. Здесь будут отображаться жалобы и очередь
          на проверку.
        </p>
      </header>

      <div className="rounded-3xl border border-dashed border-border bg-card/70 p-6 text-sm text-muted-foreground">
        <p>
          Сейчас система комментариев находится в разработке. После запуска здесь появится список новых сообщений и инструмент
          модерации.
        </p>
      </div>
    </div>
  );
}
