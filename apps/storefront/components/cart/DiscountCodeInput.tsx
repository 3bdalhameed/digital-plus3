"use client";

import { useState } from "react";
import { CheckCircle2, Tag, X, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useLocaleStore } from "@/lib/locale-store";
import { formatPrice } from "@/lib/utils";

/**
 * Discount-code entry that lives in both the cart and checkout summary.
 * Server-side validation lives in /api/discount/validate; this component
 * only handles the UX: input → POST → save to store or show error.
 *
 * The applied discount is persisted in the cart store, so entering a
 * code on /cart carries into /checkout automatically and vice versa.
 * A user email (from the checkout form or NextAuth session) can be
 * passed via `customerEmail` so the per-customer usage cap kicks in.
 */
export function DiscountCodeInput({
  customerEmail,
}: {
  customerEmail?: string;
}) {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const applyDiscount = useCartStore((s) => s.applyDiscount);
  const clearDiscount = useCartStore((s) => s.clearDiscount);
  const { currency: userCurrency, rates } = useLocaleStore();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          subtotal: totalPrice(),
          currency: "USD",
          items: items.map((it) => ({
            productId: it.product.id,
            categoryId: (it.product.category as any)?.id ?? it.product.category,
            quantity: it.quantity,
            price: it.product.price,
          })),
          customerEmail,
        }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.message || "كود غير صالح");
        return;
      }
      applyDiscount({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        amount: data.amount,
      });
      setCode("");
    } catch {
      setError("تعذّر التحقق من الكود، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  if (appliedDiscount) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm" dir="rtl">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold">تم تطبيق: {appliedDiscount.code}</div>
            <div className="text-xs text-green-600">
              خصم {formatPrice(appliedDiscount.amount, "USD", userCurrency, rates)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={clearDiscount}
          aria-label="إزالة الكود"
          className="rounded-lg p-1.5 text-green-700 hover:bg-green-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} dir="rtl" className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="أدخل كود الخصم"
            aria-label="كود الخصم"
            disabled={loading}
            className="w-full rounded-xl border border-brand-100 bg-white py-2.5 pr-10 pl-4 text-sm font-bold tracking-wide text-brand-800 placeholder:font-normal placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
            style={{ fontFeatureSettings: '"tnum"' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="brand-btn shrink-0 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تطبيق"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </form>
  );
}
