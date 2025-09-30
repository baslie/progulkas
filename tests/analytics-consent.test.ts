import { describe, expect, it } from "vitest";

import {
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  persistCookieConsent,
  type CookieConsentValue,
} from "@/lib/analytics/consent";

function createStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  } satisfies Pick<Storage, "getItem" | "setItem">;
}

describe("cookie consent helpers", () => {
  it("returns null when storage is missing", () => {
    expect(readCookieConsent(undefined)).toBeNull();
    expect(readCookieConsent(null)).toBeNull();
  });

  it("parses known consent values", () => {
    const storage = createStorage({ [COOKIE_CONSENT_KEY]: "accepted" });
    expect(readCookieConsent(storage)).toBe("accepted");

    storage.setItem(COOKIE_CONSENT_KEY, "declined");
    expect(readCookieConsent(storage)).toBe("declined");
  });

  it("ignores unknown values", () => {
    const storage = createStorage({ [COOKIE_CONSENT_KEY]: "maybe" });
    expect(readCookieConsent(storage)).toBeNull();
  });

  it("persists consent decisions", () => {
    const storage = createStorage();
    const save = (value: CookieConsentValue) => persistCookieConsent(storage, value);

    save("accepted");
    expect(readCookieConsent(storage)).toBe("accepted");

    save("declined");
    expect(readCookieConsent(storage)).toBe("declined");
  });
});
