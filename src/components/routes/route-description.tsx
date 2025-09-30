import type { ReactNode } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function RouteDescription({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="space-y-4 text-base leading-relaxed text-muted-foreground [&>h2]:mt-10 [&>h2]:text-2xl [&>h2]:font-semibold [&>h3]:mt-8 [&>h3]:text-xl [&>h3]:font-semibold [&>p]:text-base [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:space-y-2 [&>ol]:pl-5 [&>a]:text-primary [&>a]:underline"
      components={{
        strong: ({ children }) => <strong className="text-foreground">{children}</strong>,
        em: ({ children }) => <em className="text-foreground/80">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/40 bg-primary/5 px-4 py-2 text-base text-muted-foreground">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full table-auto border-collapse text-sm text-muted-foreground">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted/60 px-3 py-2 text-left font-semibold text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
        code: ({ inline, children }: { inline?: boolean; children?: ReactNode | ReactNode[] }) => {
          const contentArray = Array.isArray(children)
            ? children
            : children !== undefined
              ? [children]
              : [];
          const textContent = contentArray
            .map((child) => (typeof child === "string" ? child : ""))
            .join("");

          return inline ? (
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{textContent}</code>
          ) : (
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
              <code>{textContent}</code>
            </pre>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
