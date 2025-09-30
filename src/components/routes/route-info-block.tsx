import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function RouteInfoBlock({
  title,
  icon,
  content,
  children,
  emptyLabel = "Информация появится позже",
  className,
}: {
  title: string;
  icon?: ReactNode;
  content?: string | null;
  children?: ReactNode;
  emptyLabel?: string;
  className?: string;
}) {
  const hasContent = (typeof content === "string" && content.trim().length > 0) || Boolean(children);

  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md focus-within:shadow-md",
        className,
      )}
    >
      <header className="flex items-center gap-3 text-foreground">
        {icon ? <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</span> : null}
        <h3 className="text-lg font-semibold">{title}</h3>
      </header>
      <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {hasContent ? (
          content ? <p className="whitespace-pre-line">{content}</p> : children
        ) : (
          <p className="italic text-muted-foreground/70">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
