const SPAM_KEYWORDS = [
  "крипто",
  "криптовалюта",
  "ставки",
  "быстрый заработок",
  "лохотрон",
  "casino",
  "казино",
  "заработай",
  "пассивный доход",
  "переходи по ссылке",
];

const LINK_PATTERN = /https?:\/\//gi;
const RAW_URL_PATTERN = /www\.[a-z0-9\-]+/gi;
const REPEATED_CHAR_PATTERN = /(.)\1{4,}/i;

export function normalizeCommentContent(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function calculateSpamScore(raw: string): number {
  const content = normalizeCommentContent(raw);
  if (!content) {
    return 1;
  }

  let score = 0;
  const lower = content.toLowerCase();

  const linkMatches = content.match(LINK_PATTERN)?.length ?? 0;
  if (linkMatches) {
    score += 0.45 + Math.min(0.3, linkMatches * 0.1);
  }

  const rawUrlMatches = content.match(RAW_URL_PATTERN)?.length ?? 0;
  if (rawUrlMatches) {
    score += 0.25;
  }

  for (const keyword of SPAM_KEYWORDS) {
    if (lower.includes(keyword)) {
      score += 0.35;
    }
  }

  if (/[A-ZА-Я]{6,}/.test(content)) {
    score += 0.2;
  }

  if (REPEATED_CHAR_PATTERN.test(content)) {
    score += 0.2;
  }

  const words = content.split(" ");
  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
  if (uniqueWords.size <= Math.ceil(words.length / 2)) {
    score += 0.15;
  }

  if (content.length < 20) {
    score += 0.2;
  }

  return Math.min(1, Number(score.toFixed(2)));
}

export function isLikelySpam(raw: string): boolean {
  return calculateSpamScore(raw) >= 0.6;
}
