import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "ar" | "en";
export type Currency = "USD" | "SAR" | "JOD" | "AED";

// Approximate fixed rates relative to USD
const TO_USD: Record<string, number> = {
  USD: 1,
  SAR: 1 / 3.75,
  JOD: 1 / 0.71,
  AED: 1 / 3.67,
};
const FROM_USD: Record<string, number> = {
  USD: 1,
  SAR: 3.75,
  JOD: 0.71,
  AED: 3.67,
};

export function convertPrice(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const usd = amount * (TO_USD[from] ?? 1);
  return usd * (FROM_USD[to] ?? 1);
}

interface LocaleState {
  lang: Lang;
  currency: Currency;
  setLang: (lang: Lang) => void;
  setCurrency: (currency: Currency) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      lang: "ar",
      currency: "USD",
      setLang: (lang) => set({ lang }),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "locale-storage" }
  )
);
