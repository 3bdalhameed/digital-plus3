"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

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
  const { isEn } = useT();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const busy = submitting || pending;

  // Map known Arabic API error strings to English so the same
  // /api/orders/[id]/confirm responses render correctly regardless
  // of the visitor's locale. Falls back to the raw message when
  // there's no known translation.
  const translateApiError = (raw?: string) => {
    if (!raw || !isEn) return raw;
    const map: Record<string, string> = {
      "لا يمكنك تعديل هذا الطلب": "You can't modify this order.",
      "فشل تأكيد الطلب":         "Could not confirm the order.",
      "غير مصرح":                 "Unauthorized.",
    };
    return map[raw] ?? raw;
  };

  const L = {
    confirming:   isEn ? "Confirming..."           : "جاري التأكيد...",
    confirmLabel: isEn ? "Confirm order receipt"   : "تأكيد استلام الطلب",
    failed:       isEn ? "Could not confirm the order." : "فشل تأكيد الطلب",
    offline:      isEn ? "Could not reach the server."  : "تعذر الاتصال بالخادم",
  };

  async function handleClick() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(translateApiError(data?.error) || L.failed);
        return;
      }
      // Server component refresh so the new status is reflected in the
      // header badge, and the "Rate Product" pills appear on each item.
      startTransition(() => router.refresh());
    } catch (e: any) {
      setError(L.offline);
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
        <span>{busy ? L.confirming : L.confirmLabel}</span>
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
