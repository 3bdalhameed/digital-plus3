import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "ar" | "en";
export type Currency = "USD" | "SAR" | "JOD" | "AED";

/**
 * currencySource tracks how the current currency was set:
 *   - "default":  initial value, never changed — eligible for auto-detection
 *   - "detected": set by /api/geo from the visitor's IP country — still
 *                 eligible for re-detection on next visit (so the value
 *                 stays in sync if the visitor moves countries)
 *   - "user":     the visitor explicitly picked via the switcher —
 *                 NEVER overridden by auto-detection
 */
export type CurrencySource = "default" | "detected" | "user";

const FALLBACK_RATES: Record<string, number> = { USD: 1, SAR: 3.75, JOD: 0.71, AED: 3.67 };

interface LocaleState {
  lang: Lang;
  currency: Currency;
  currencySource: CurrencySource;
  rates: Record<string, number>;
  ratesDate: string;
  setLang: (lang: Lang) => void;
  setCurrency: (currency: Currency) => void;
  fetchRates: () => Promise<void>;
  detectCurrency: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      lang: "ar",
      currency: "USD",
      currencySource: "default",
      rates: FALLBACK_RATES,
      ratesDate: "",

      setLang: (lang) => set({ lang }),

      // Setting currency through the switcher LOCKS it to "user" so
      // future auto-detection calls don't overwrite the choice.
      setCurrency: (currency) => set({ currency, currencySource: "user" }),

      fetchRates: async () => {
        const today = new Date().toISOString().slice(0, 10);
        if (get().ratesDate === today) return; // already fresh
        try {
          const res = await fetch("/api/exchange-rates");
          if (res.ok) {
            const { rates, date } = await res.json();
            set({ rates, ratesDate: date });
          }
        } catch {}
      },

      // Auto-detect the visitor's currency from their IP country.
      // Called once per session by the Header on mount.
      // Skips entirely if the user has manually picked a currency.
      detectCurrency: async () => {
        if (get().currencySource === "user") return;
        try {
          const res = await fetch("/api/geo");
          if (!res.ok) return;
          const data: { country: string | null; currency: Currency; detected: boolean } = await res.json();
          if (data.detected && data.currency) {
            set({ currency: data.currency, currencySource: "detected" });
          }
        } catch {}
      },
    }),
    { name: "locale-storage" }
  )
);

/**
 * Convert amount from one currency to another using live rates.
 * rates[X] = X per 1 USD  (e.g. SAR: 3.75 means 1 USD = 3.75 SAR)
 */
export function convertPrice(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to) return amount;
  const usd = amount / (rates[from] ?? 1);
  return usd * (rates[to] ?? 1);
}
