const PLATFORM_TEMPLATES = {
  telegram: ({ url, title, summary }: ShareInput) =>
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}\n${summary}`)}`,
  vk: ({ url, title, summary }: ShareInput) =>
    `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&comment=${encodeURIComponent(summary)}`,
} as const;

type SharePlatform = keyof typeof PLATFORM_TEMPLATES;

type ShareInput = {
  url: string;
  title: string;
  summary: string;
};

export function buildShareLink(platform: SharePlatform, url: string, title: string, summary: string): string {
  const normalizedUrl = url.startsWith("http") ? url : `https://progulkas.local${url.startsWith("/") ? url : `/${url}`}`;
  const normalizedSummary = summary.length > 160 ? `${summary.slice(0, 157)}…` : summary;
  const builder = PLATFORM_TEMPLATES[platform];
  return builder({ url: normalizedUrl, title, summary: normalizedSummary });
}
