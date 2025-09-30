import { describe, expect, it, vi } from "vitest";

import { describeAuditAction, sanitizeAuditMetadata } from "@/lib/admin/audit-log-helpers";

describe("audit log helpers", () => {
  it("maps known actions to human readable labels", () => {
    expect(describeAuditAction("route.create")).toBe("Создание маршрута");
    expect(describeAuditAction("unknown.action"))
      .toBe("unknown.action");
  });

  it("serializes metadata safely", () => {
    const metadata = sanitizeAuditMetadata({
      title: "Маршрут",
      updatedAt: new Date("2025-03-12T10:00:00Z"),
      total: BigInt(10),
      nested: { ok: true },
    });

    expect(metadata).toMatchObject({
      title: "Маршрут",
      nested: { ok: true },
    });
    expect(metadata?.updatedAt).toBe("2025-03-12T10:00:00.000Z");
    expect(metadata?.total).toBe("10");
  });

  it("returns null for circular structures", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const result = sanitizeAuditMetadata(circular);
    expect(result).toBeNull();
    errorSpy.mockRestore();
  });
});
