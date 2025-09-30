import { notFound } from "next/navigation";
import { z } from "zod";

import { RouteEditorForm } from "@/components/admin/route-editor-form";
import { getRouteForAdmin } from "@/lib/admin/routes";
import { getAuthorCandidates } from "@/lib/admin/users";
import { hasRole, requireAuthor } from "@/lib/auth/session";

const paramsSchema = z.object({ routeId: z.string().min(1) });

type PageProps = {
  params: Promise<{ routeId: string }>;
};

export default async function EditRoutePage({ params }: PageProps) {
  const user = await requireAuthor();
  const { routeId } = paramsSchema.parse(await params);
  const route = await getRouteForAdmin(routeId);

  const canEdit = hasRole(user, "admin") || route.authors.some((author) => author.id === user.id);
  if (!canEdit) {
    notFound();
  }

  const authors = await getAuthorCandidates();
  const canPublish = hasRole(user, "admin");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Редактирование: {route.title}</h1>
        <p className="text-sm text-muted-foreground">
          Обновите данные маршрута, точки интереса и медиа. Изменения вступят в силу после сохранения.
        </p>
      </header>
      <RouteEditorForm
        authors={authors}
        currentUserId={user.id}
        canPublish={canPublish}
        initialRoute={route}
      />
    </div>
  );
}
