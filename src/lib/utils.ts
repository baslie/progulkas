import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const distanceFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDistance(distanceKm: number) {
  return `${distanceFormatter.format(distanceKm)} км`;
}

export function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "до 30 мин";
  }

  const wholeMinutes = Math.round(minutes);
  const hours = Math.floor(wholeMinutes / 60);
  const rest = wholeMinutes % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ч`);
  }

  if (rest > 0) {
    parts.push(`${rest} мин`);
  }

  return parts.length ? parts.join(" ") : "до 1 ч";
}

export function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

const CYRILLIC_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugify(input: string): string {
  const lower = input.toLowerCase();
  const transliterated = Array.from(lower)
    .map((char) => {
      if (CYRILLIC_MAP[char]) {
        return CYRILLIC_MAP[char];
      }

      if (/[a-z0-9]/.test(char)) {
        return char;
      }

      if (char === " " || char === "-" || char === "_") {
        return "-";
      }

      return "-";
    })
    .join("");

  const normalized = transliterated
    .normalize("NFD")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "route";
}
