"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_EVENT,
  type CookieConsentValue,
  emitCookieConsentEvent,
  persistCookieConsent,
  readCookieConsent,
} from "@/lib/analytics/consent";

type ConsentEvent = CustomEvent<CookieConsentValue>;

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const consent = readCookieConsent(window.localStorage);
    setIsVisible(consent === null);

    const handleConsentChange = (event: Event) => {
      const value = (event as ConsentEvent).detail;
      if (value === "accepted" || value === "declined") {
        setIsVisible(false);
      }
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentChange as EventListener);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentChange as EventListener);
    };
  }, []);

  const updateConsent = (value: CookieConsentValue) => {
    if (typeof window === "undefined") {
      return;
    }

    persistCookieConsent(window.localStorage, value);
    emitCookieConsentEvent(value);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-background/95 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Мы используем cookies</p>
            <p className="text-sm text-muted-foreground">
              Cookies помогают нам анализировать использование платформы и улучшать сервис. Подробнее в нашей{" "}
              <Link href="/legal/privacy" className="text-primary underline-offset-4 hover:underline">
                Политике конфиденциальности
              </Link>
              .
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button size="sm" onClick={() => updateConsent("accepted")}>
              Принять все
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateConsent("declined")}>
              Только необходимые
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
