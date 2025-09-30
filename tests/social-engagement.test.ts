import { describe, expect, it } from "vitest";

import { calculateSpamScore, isLikelySpam, normalizeCommentContent } from "@/lib/social/anti-spam";
import { buildShareLink } from "@/lib/social/share";

describe("anti-spam heuristics", () => {
  it("treats clean text as non-spam", () => {
    const text = "Отличный маршрут: чистые дорожки, есть лавочки и освещение";
    expect(calculateSpamScore(text)).toBeLessThan(0.4);
    expect(isLikelySpam(text)).toBe(false);
  });

  it("flags obvious spam", () => {
    const text = "Заработай на крипто казино!!! Переходи по ссылке http://spam.example";
    expect(calculateSpamScore(text)).toBeGreaterThan(0.6);
    expect(isLikelySpam(text)).toBe(true);
  });

  it("normalizes whitespace", () => {
    expect(normalizeCommentContent("  Привет\nмир  ")).toBe("Привет мир");
  });
});

describe("share links", () => {
  it("builds telegram link", () => {
    const link = buildShareLink("telegram", "/catalog/marshrut", "Заголовок", "Описание маршрута");
    expect(link).toContain("https://t.me/share/url");
    expect(link).toContain(encodeURIComponent("https://progulkas.local/catalog/marshrut"));
  });

  it("builds vk link with absolute url", () => {
    const link = buildShareLink("vk", "https://example.com/route", "Заголовок", "Описание");
    expect(link).toContain("vk.com/share.php");
    expect(link).toContain(encodeURIComponent("https://example.com/route"));
  });

  it("normalizes relative links and summary length", () => {
    const summary = "Очень длинное описание маршрута, которое явно превышает ограничение в сто шестьдесят символов. "
      + "Оно специально написано так, чтобы проверить обрезку и появление многоточия в конце.";
    const link = buildShareLink("telegram", "catalog/osenniy", "Осенний маршрут", summary);
    const parsed = new URL(link);
    const textParam = parsed.searchParams.get("text");
    const urlParam = parsed.searchParams.get("url");
    expect(urlParam).toBe("https://progulkas.local/catalog/osenniy");
    expect(textParam).not.toBeNull();
    expect(textParam).toContain("Осенний маршрут");
    expect(textParam?.endsWith("…")).toBe(true);
    expect(textParam!.length).toBeLessThan(summary.length + "Осенний маршрут".length);
  });
});
