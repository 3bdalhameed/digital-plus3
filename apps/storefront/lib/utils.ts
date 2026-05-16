import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TO_USD: Record<string, number> = { USD: 1, SAR: 1 / 3.75, JOD: 1 / 0.71, AED: 1 / 3.67 };
const FROM_USD: Record<string, number> = { USD: 1, SAR: 3.75, JOD: 0.71, AED: 3.67 };

/** Format price — converts from product currency to display currency if different */
export function formatPrice(amount: number, fromCurrency = "USD", toCurrency?: string): string {
  const target = toCurrency ?? fromCurrency;
  const converted =
    toCurrency && toCurrency !== fromCurrency
      ? (amount * (TO_USD[fromCurrency] ?? 1)) * (FROM_USD[toCurrency] ?? 1)
      : amount;
  return new Intl.NumberFormat("ar-JO", {
    style: "currency",
    currency: target,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(converted);
}

/** Get localized name (Arabic preferred) */
export function getName(name: { ar: string; en: string }, locale = "ar"): string {
  return locale === "ar" ? name.ar : name.en;
}

/** Generate a unique session ID */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Truncate text */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/** Get relative time in Arabic */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 30) return `منذ ${days} يوم`;
  return d.toLocaleDateString("ar-JO");
}

/** Order status label in Arabic */
export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "قيد الانتظار",
    paid: "مدفوع",
    delivered: "تم التسليم",
    disputed: "متنازع عليه",
    refunded: "مسترد",
    cancelled: "ملغي",
  };
  return map[status] || status;
}

/** Order status color */
export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    disputed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}
