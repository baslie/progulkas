import { describe, expect, it } from "vitest";

import { extractClientIp, getRequestClientMetadata } from "@/lib/http/request";

describe("request metadata helpers", () => {
  it("extracts first forwarded IP when available", () => {
    const ip = extractClientIp("203.0.113.5, 198.51.100.10", null);
    expect(ip).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const ip = extractClientIp(null, "198.51.100.10");
    expect(ip).toBe("198.51.100.10");
  });

  it("ignores unknown values", () => {
    const ip = extractClientIp("unknown, ", "");
    expect(ip).toBeNull();
  });

  it("builds metadata object from request headers", () => {
    const request = new Request("https://example.com", {
      headers: new Headers({
        "x-forwarded-for": "192.0.2.1, 198.51.100.2",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1)",
      }),
    });

    const metadata = getRequestClientMetadata(request);
    expect(metadata.ipAddress).toBe("192.0.2.1");
    expect(metadata.userAgent).toContain("Mozilla/5.0");
  });
});
