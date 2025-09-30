import { describe, expect, it } from "vitest";

import { formatDistance, formatDuration } from "@/lib/utils";

describe("formatDistance", () => {
  it("formats decimal kilometers", () => {
    expect(formatDistance(5)).toBe("5 км");
    expect(formatDistance(12.345)).toBe("12,3 км");
  });
});

describe("formatDuration", () => {
  it("handles values below zero", () => {
    expect(formatDuration(-5)).toBe("до 30 мин");
  });

  it("formats minutes into hours and minutes", () => {
    expect(formatDuration(45)).toBe("45 мин");
    expect(formatDuration(90)).toBe("1 ч 30 мин");
    expect(formatDuration(180)).toBe("3 ч");
  });
});
