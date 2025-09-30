"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

import { COOKIE_CONSENT_EVENT, type CookieConsentValue, readCookieConsent } from "@/lib/analytics/consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YM_COUNTER_ID;

type ConsentState = "unknown" | CookieConsentValue;

type ConsentEvent = CustomEvent<CookieConsentValue>;

export function AnalyticsScripts() {
  const [consent, setConsent] = useState<ConsentState>("unknown");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setConsent(readCookieConsent(window.localStorage) ?? "unknown");

    const handle = (event: Event) => {
      const detail = (event as ConsentEvent).detail;
      if (detail === "accepted" || detail === "declined") {
        setConsent(detail);
      }
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handle as EventListener);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, handle as EventListener);
    };
  }, []);

  if (!GA_MEASUREMENT_ID && !YM_COUNTER_ID) {
    return null;
  }

  if (consent !== "accepted") {
    return null;
  }

  return (
    <>
      {GA_MEASUREMENT_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true, send_page_view: true });`}
          </Script>
        </>
      ) : null}
      {YM_COUNTER_ID ? (
        <>
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments);};
  m[i].l=1*new Date();
  k=e.createElement(t),a=e.getElementsByTagName(t)[0];
  k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${YM_COUNTER_ID}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });`}
          </Script>
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://mc.yandex.ru/watch/${YM_COUNTER_ID}`} alt="" style={{ display: "none" }} />
            </div>
          </noscript>
        </>
      ) : null}
    </>
  );
}
