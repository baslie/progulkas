import { RouteEditorForm } from "@/components/admin/route-editor-form";
import { getAuthorCandidates } from "@/lib/admin/users";
import { hasRole, requireAuthor } from "@/lib/auth/session";

export default async function NewRoutePage() {
  const user = await requireAuthor();
  const authors = await getAuthorCandidates();
  const canPublish = hasRole(user, "admin");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Новый маршрут</h1>
        <p className="text-sm text-muted-foreground">
          Заполните информацию о маршруте, загрузите трек и подготовьте материалы для публикации.
        </p>
      </header>
      <RouteEditorForm authors={authors} currentUserId={user.id} canPublish={canPublish} />
    </div>
  );
}
