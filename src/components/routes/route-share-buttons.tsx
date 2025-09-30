"use client";

import { useMutation } from "@tanstack/react-query";
import { Copy, Share2, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { buildShareLink } from "@/lib/social/share";
import { Button } from "@/components/ui/button";

type RouteShareButtonsProps = {
  url: string;
  title: string;
  summary: string;
};

export function RouteShareButtons({ url, title, summary }: RouteShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const shareTargets = useMemo(
    () => [
      {
        label: "Telegram",
        href: buildShareLink("telegram", url, title, summary),
        icon: <Send className="h-3.5 w-3.5" aria-hidden />,
      },
      {
        label: "VK",
        href: buildShareLink("vk", url, title, summary),
        icon: <Share2 className="h-3.5 w-3.5" aria-hidden />,
      },
    ],
    [url, title, summary],
  );

  async function handleNativeShare() {
    setShareError(null);
    if (typeof navigator === "undefined" || !navigator.share) {
      setShareError("Нативный шэринг не поддерживается вашим браузером");
      return;
    }

    try {
      await navigator.share({
        url,
        title,
        text: summary,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      setShareError("Не удалось поделиться ссылкой");
    }
  }

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Буфер обмена недоступен");
      }
      await navigator.clipboard.writeText(url);
    },
    onSuccess: () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    onError: (error) => {
      setShareError(error instanceof Error ? error.message : "Не удалось скопировать ссылку");
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleNativeShare}>
          <Share2 className="h-4 w-4" aria-hidden />
          Поделиться
        </Button>
        {shareTargets.map((target) => (
          <Button key={target.label} variant="ghost" size="sm" className="gap-2" asChild>
            <a href={target.href} target="_blank" rel="noopener noreferrer">
              {target.icon}
              {target.label}
            </a>
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => copyMutation.mutate()}
          disabled={copyMutation.isPending}
        >
          <Copy className="h-4 w-4" aria-hidden />
          {copied ? "Скопировано" : "Скопировать ссылку"}
        </Button>
      </div>
      {shareError ? <p className="text-xs text-destructive">{shareError}</p> : null}
    </div>
  );
}
