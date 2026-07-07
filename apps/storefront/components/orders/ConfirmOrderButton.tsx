"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

/**
 * Manual order-confirm button shown on /orders/[id] when the order is
 * in `paid` status. Posts to /api/orders/:id/confirm which flips the
 * status to `delivered`. Falls back to the automated 7-day sweep if
 * the customer never clicks.
 *
 * States:
 *   - idle: normal button
 *   - submitting: spinner + disabled
 *   - error: inline error message under the button, button re-enabled
 * On success we router.refresh() so the server component re-fetches
 * the order and the badge + Rate buttons appear immediately.
 */
export function ConfirmOrderButton({ orderId }: { orderId: string | number }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const busy = submitting || pending;

  async function handleClick() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "فشل تأكيد الطلب");
        return;
      }
      // Server component refresh so the new status is reflected in the
      // header badge, and the "Rate Product" pills appear on each item.
      startTransition(() => router.refresh());
    } catch (e: any) {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
        ) : (
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
        )}
        <span>{busy ? "جاري التأكيد..." : "تأكيد استلام الطلب"}</span>
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
