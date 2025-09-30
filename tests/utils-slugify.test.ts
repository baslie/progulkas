import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/utils";

describe("slugify", () => {
  it("транслитерирует кириллицу", () => {
    expect(slugify("Привет, Томск!")).toBe("privet-tomsk");
    expect(slugify("Ёлки-Палки")).toBe("elki-palki");
  });

  it("обрабатывает пустые значения", () => {
    expect(slugify("")).toBe("route");
  });
});
