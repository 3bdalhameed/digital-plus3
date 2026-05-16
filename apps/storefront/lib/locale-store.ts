import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "ar" | "en";
export type Currency = "USD" | "SAR" | "JOD" | "AED";

const FALLBACK_RATES: Record<string, number> = { USD: 1, SAR: 3.75, JOD: 0.71, AED: 3.67 };

interface LocaleState {
  lang: Lang;
  currency: Currency;
  rates: Record<string, number>;
  ratesDate: string;
  setLang: (lang: Lang) => void;
  setCurrency: (currency: Currency) => void;
  fetchRates: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      lang: "ar",
      currency: "USD",
      rates: FALLBACK_RATES,
      ratesDate: "",

      setLang: (lang) => set({ lang }),
      setCurrency: (currency) => set({ currency }),

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
