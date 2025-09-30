import { describe, expect, it } from "vitest";

import { ROUTE_AUDIENCES, ROUTE_DIFFICULTIES } from "@/lib/routes/constants";
import { parseCatalogSearchParams } from "@/lib/routes/search-params";

const [easy, moderate] = ROUTE_DIFFICULTIES.map((option) => option.value);
const [walk, run] = ROUTE_AUDIENCES.map((option) => option.value);

describe("parseCatalogSearchParams", () => {
  it("parses base query parameters", () => {
    const filters = parseCatalogSearchParams({
      q: "  прогулка по набережной  ",
      difficulty: `${easy},${moderate}`,
      distance: "medium",
      duration: "long",
      audience: `${walk},${run}`,
    });

    expect(filters.query).toBe("прогулка по набережной");
    expect(filters.difficulties).toEqual([easy, moderate]);
    expect(filters.distance).toBe("medium");
    expect(filters.duration).toBe("long");
    expect(filters.audiences).toEqual([walk, run]);
  });

  it("ignores invalid values and duplicates", () => {
    const filters = parseCatalogSearchParams({
      difficulty: ["invalid", easy, easy],
      audience: ["", walk, "bike"],
      distance: "unknown",
      duration: "",
    });

    expect(filters.difficulties).toEqual([easy]);
    expect(filters.audiences).toEqual([walk]);
    expect(filters.distance).toBeUndefined();
    expect(filters.duration).toBeUndefined();
  });
});
