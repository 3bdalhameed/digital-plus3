"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Exit-intent popup, modelled after the Shopify Easy-Popups app the old
 * digital-plus3.com storefront used.
 *
 * Triggers when:
 *   - Desktop: the mouse leaves the viewport at the top edge
 *   - Mobile : the user scrolls up sharply (proxy for "about to close")
 *
 * Shows at most once per browser session (sessionStorage flag).
 *
 * Copy is fully editable in CMS Site Settings ("نافذة نية المغادرة")
 * -- coupon code, headline / subheadline / body all have Ar+En slots.
 * Storefront picks the language from useLocaleStore; each field falls
 * back to a hardcoded default if the CMS field is blank so a
 * half-configured setup still shows something reasonable.
 */
export type ExitPopupSettings = {
  enabled?: boolean;
  couponCode?: string;
  headlineAr?: string;
  headlineEn?: string;
  subheadlineAr?: string;
  subheadlineEn?: string;
  bodyAr?: string;
  bodyEn?: string;
};

export function ExitIntentPopup({
  cms,
  storageKey = "dp-exit-popup-shown-v1",
}: {
  cms?: ExitPopupSettings;
  storageKey?: string;
} = {}) {
  const { isEn } = useT();

  const enabled = cms?.enabled ?? true;
  const couponCode = cms?.couponCode || "PLUS7";
  const headline = isEn
    ? (cms?.headlineEn || "🛑 Wait — before you go!")
    : (cms?.headlineAr || "🛑 لحظة قبل ما تغلق الشاشة!");
  const subheadline = isEn
    ? (cms?.subheadlineEn || "🤝 Don't leave without your exclusive offer")
    : (cms?.subheadlineAr || "🤝 لا تذهب بدون عرض حصري قبل المغادرة");
  const body = isEn
    ? (cms?.bodyEn || "Use this discount code at checkout and get an instant discount on every digital product in the store.")
    : (cms?.bodyAr || "استخدم كود الخصم التالي عند الشراء واحصل على خصم فوري على كل المنتجات الرقمية في المتجر.");

  const L = {
    close:      isEn ? "Close"           : "إغلاق",
    couponLbl:  isEn ? "Discount code"   : "كود الخصم",
    copyBtn:    isEn ? "Copy code"       : "نسخ الكود",
    copiedBtn:  isEn ? "Code copied"     : "تم نسخ الكود",
    dismiss:    isEn ? "No, thanks"      : "لا، شكراً",
  };

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const trigger = useCallback(() => {
    if (!enabled) return;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {}
    setOpen(true);
  }, [storageKey, enabled]);

  useEffect(() => {
    // Don't trigger on the first 4 seconds — gives the page a chance to load
    // and avoids firing as the cursor passes through the address bar area.
    const armAt = Date.now() + 4000;

    const onMouseLeave = (e: MouseEvent) => {
      if (Date.now() < armAt) return;
      // Only fire when leaving via the TOP of the viewport.
      if (e.clientY <= 0) trigger();
    };

    // Mobile: detect a sharp upward scroll near the very top of the page
    // (i.e. user is about to swipe out to the address bar).
    let lastY = window.scrollY;
    let lastT = Date.now();
    const onScroll = () => {
      if (Date.now() < armAt) {
        lastY = window.scrollY;
        lastT = Date.now();
        return;
      }
      const y = window.scrollY;
      const t = Date.now();
      const dy = lastY - y; // positive = upward
      const dt = t - lastT;
      if (dy > 80 && dt < 250 && y < 200) trigger();
      lastY = y;
      lastT = t;
    };

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [trigger]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-[dp-fade_180ms_ease-out]"
      style={{ backdropFilter: "blur(2px)", background: "rgba(15, 11, 35, 0.55)" }}
      onClick={() => setOpen(false)}
      dir={isEn ? "ltr" : "rtl"}
    >
      <style>{`
        @keyframes dp-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dp-pop  { from { opacity: 0; transform: translateY(8px) scale(.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes dp-shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md animate-[dp-pop_240ms_cubic-bezier(.2,.8,.2,1)] overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Top gradient ribbon with mascot-like emoji cluster */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#9333EA] px-6 pt-6 pb-12 text-center text-white">
          <button
            onClick={() => setOpen(false)}
            aria-label={L.close}
            className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          {/* Floating emoji cluster (mascot stand-in) */}
          <div className="mb-2 select-none text-4xl leading-none" aria-hidden>
            <span className="inline-block animate-pulse">🚀</span>
            <span className="mx-2 inline-block">🎁</span>
            <span className="inline-block animate-pulse">✨</span>
          </div>

          <h2 className="text-lg font-black leading-tight sm:text-xl">{headline}</h2>
          {subheadline && (
            <p className="mt-1.5 text-sm text-white/85 sm:text-base">{subheadline}</p>
          )}

          {/* Decorative bottom curve */}
          <svg className="absolute -bottom-px left-0 right-0 w-full text-white" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden>
            <path d="M0,32 C360,80 1080,0 1440,40 L1440,64 L0,64 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Body */}
        <div className="px-6 pt-2 pb-6 text-center">
          <p className="text-sm leading-relaxed text-[#4b5563] sm:text-base">{body}</p>

          {/* Coupon box */}
          <div className="relative mt-5 overflow-hidden rounded-2xl border-2 border-dashed border-[#7C3AED]/40 bg-gradient-to-br from-[#F5F3FF] via-[#EDE9FE] to-[#F5F3FF] p-4">
            <span className="block text-xs font-bold tracking-widest text-[#7C3AED]/70">
              {L.couponLbl}
            </span>
            <div className="mt-1 flex items-center justify-center gap-2" dir="ltr">
              <span className="text-3xl font-black tracking-[0.15em] text-[#1e1b4b]" style={{ fontFeatureSettings: '"tnum"' }}>
                {couponCode}
              </span>
            </div>
            {/* shimmer sweep */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              style={{ animation: "dp-shimmer 2400ms linear infinite" }}
            />
          </div>

          {/* CTA */}
          <button
            onClick={copy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#6D28D9] active:scale-[.98] sm:text-base"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                <span>{L.copiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>{L.copyBtn}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-[#9ca3af] underline-offset-2 hover:text-[#6b7280] hover:underline"
          >
            {L.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
