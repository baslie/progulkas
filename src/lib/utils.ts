import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const distanceFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
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
