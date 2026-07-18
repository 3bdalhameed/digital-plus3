"use client";

import { useEffect } from "react";
import { X, Globe, Coins } from "lucide-react";
import { useLocaleStore, type Currency } from "@/lib/locale-store";

/**
 * Modal that lets the visitor pick a language + currency in one
 * place. Replaces the two separate inline switches that used to sit
 * in the header. Header now shows a single trigger button (globe
 * icon + current lang code) that opens this modal.
 *
 * Selection persists via useLocaleStore (already backed by
 * localStorage). Closing the modal is enough to apply -- there's no
 * "save" button because every click on a chip commits immediately.
 */
export function LocaleModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang, currency, setLang, setCurrency } = useLocaleStore();

  // Close on Escape. Also lock body scroll while the modal is open
  // so the page underneath doesn't drift when the visitor scrolls.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isEn = lang === "en";
  const M = {
    title:        isEn ? "Language & Currency" : "اللغة والعملة",
    langHeading:  isEn ? "Language"            : "اللغة",
    currHeading:  isEn ? "Currency"            : "العملة",
    close:        isEn ? "Close"               : "إغلاق",
    done:         isEn ? "Done"                : "تم",
  };

  const currencies: { code: Currency; label: string; symbol: string }[] = [
    { code: "USD", label: isEn ? "US Dollar"        : "دولار أمريكي", symbol: "$" },
    { code: "SAR", label: isEn ? "Saudi Riyal"      : "ريال سعودي",   symbol: "ر.س" },
    { code: "JOD", label: isEn ? "Jordanian Dinar"  : "دينار أردني",  symbol: "د.أ" },
    { code: "AED", label: isEn ? "UAE Dirham"       : "درهم إماراتي", symbol: "د.إ" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={isEn ? "ltr" : "rtl"}
      >
        {/* Close button — top-end corner regardless of dir */}
        <button
          onClick={onClose}
          aria-label={M.close}
          className="absolute end-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-lg font-black text-brand-800">{M.title}</h2>

        {/* Language section */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-700">
            <Globe className="h-4 w-4" />
            <span>{M.langHeading}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLang("ar")}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                lang === "ar"
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-brand-100 bg-white text-brand-600 hover:bg-brand-50"
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setLang("en")}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                lang === "en"
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-brand-100 bg-white text-brand-600 hover:bg-brand-50"
              }`}
            >
              English
            </button>
          </div>
        </section>

        {/* Currency section */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-700">
            <Coins className="h-4 w-4" />
            <span>{M.currHeading}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                  currency === c.code
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-brand-100 bg-white text-brand-600 hover:bg-brand-50"
                }`}
              >
                <span>{c.label}</span>
                <span className="text-xs text-gray-500">{c.code}</span>
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={onClose}
          className="brand-btn w-full py-3 text-sm"
        >
          {M.done}
        </button>
      </div>
    </div>
  );
}
