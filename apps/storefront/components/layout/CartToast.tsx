"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";
import { useLocaleStore } from "@/lib/locale-store";

/**
 * Global "Added to cart" toast. Mounted once at the app root (see
 * Providers.tsx) so any surface that calls the cart store's addItem
 * -- product cards, carousels, product-detail sticky bar -- gets the
 * same slide-in feedback without each caller having to render its
 * own copy.
 *
 * Purple gradient pill matches the design mock. Slides up from
 * bottom, sits above the mobile safe-area inset, auto-hides after
 * 2s. A monotonic `bump` counter from the toast store re-triggers
 * the effect on rapid successive adds so each one gets its own
 * confirmation rather than merging into a single lingering banner.
 */
export function CartToast() {
  const bump = useToastStore((s) => s.bump);
  const lang = useLocaleStore((s) => s.lang);
  const isEn = lang === "en";
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (bump === 0) return;              // ignore initial mount
    setVisible(false);
    // Blink off-then-on so consecutive adds re-run the slide-in
    // animation. requestAnimationFrame gives the browser one paint
    // to register the "hidden" state before we flip it back on.
    const raf = requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), 2000);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [bump]);

  // Don't render anything server-side -- avoids a hydration mismatch
  // with the language-dependent copy (useLocaleStore rehydrates on
  // client only).
  if (!mounted) return null;

  const label = isEn ? "Added to cart" : "تمت الإضافة للسلة";

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
      dir={isEn ? "ltr" : "rtl"}
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] ring-1 ring-white/15">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white">
          <BadgeCheck className="h-4 w-4 text-[#16A34A]" strokeWidth={2.5} />
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
}
