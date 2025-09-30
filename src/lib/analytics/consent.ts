export const COOKIE_CONSENT_KEY = "progulkas:cookie-consent";
export const COOKIE_CONSENT_EVENT = "progulkas:cookie-consent-change";

export type CookieConsentValue = "accepted" | "declined";

export function readCookieConsent(
  storage: Pick<Storage, "getItem"> | undefined | null,
): CookieConsentValue | null {
  if (!storage) {
    return null;
  }

  const value = storage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "declined") {
    return value;
  }

  return null;
}

export function persistCookieConsent(
  storage: Pick<Storage, "setItem"> | undefined | null,
  value: CookieConsentValue,
): void {
  if (!storage) {
    return;
  }

  storage.setItem(COOKIE_CONSENT_KEY, value);
}

export function emitCookieConsentEvent(value: CookieConsentValue): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<CookieConsentValue>(COOKIE_CONSENT_EVENT, { detail: value }));
}
