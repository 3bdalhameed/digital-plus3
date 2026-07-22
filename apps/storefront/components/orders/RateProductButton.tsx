"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Star, Loader2, X, CheckCircle } from "lucide-react";

/**
 * Inline "قيّم المنتج" button that opens a small rating modal on the
 * same page. Posts to /api/reviews (which writes to the unified reviews
 * table with source='customer'). On success we close the modal and
 * router.refresh() so the server component re-fetches and the pill
 * turns into stars without a full navigation.
 *
 * If either orderId or productId is missing we still render the
 * disabled shell so alignment doesn't jump between rated and
 * unrateable items -- the click handler bails silently in that case.
 */
export function RateProductButton({
  orderId,
  productId,
  productName,
  size = "sm",
}: {
  orderId: string | number;
  productId: string | number;
  productName?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [open,  setOpen]  = useState(false);
  const [rating, setRating] = useState(0);
  const [hover,  setHover]  = useState(0);
  const [text,   setText]   = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [done,   setDone]   = useState(false);
  const [, startTransition] = useTransition();

  // Portal target. The modal is `position: fixed`, but the order
  // cards on /orders use transform (hover/expand), which makes a
  // fixed descendant resolve against the card instead of the
  // viewport -- clipping the modal inside the card. Rendering into
  // document.body via a portal escapes any transformed ancestor.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const displayed = hover || rating;

  const reset = () => {
    setRating(0);
    setHover(0);
    setText("");
    setError(null);
    setDone(false);
  };

  const handleSubmit = async () => {
    setError(null);
    if (rating < 1 || rating > 5) {
      setError("يرجى اختيار تقييم من 1 إلى 5 نجوم");
      return;
    }
    if (!orderId || !productId) {
      setError("بيانات المنتج غير مكتملة");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:   Number(orderId),
          productId: Number(productId),
          rating,
          reviewText: text.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "فشل إرسال التقييم");
        return;
      }
      setDone(true);
      // Refresh so the server component re-fetches the review row and
      // the pill turns into stars. Small delay so the user sees the
      // green checkmark first.
      setTimeout(() => {
        startTransition(() => router.refresh());
        setOpen(false);
        reset();
      }, 900);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  };

  const btnClass =
    size === "md"
      ? "inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95"
      : "inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-700";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClass}>
        <Star className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={2.5} fill="currentColor" />
        <span>قيّم المنتج</span>
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (busy) return;
            setOpen(false);
            reset();
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-brand-800">قيّم المنتج</h3>
                {productName && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{productName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (busy) return;
                  setOpen(false);
                  reset();
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle className="h-10 w-10 text-green-500" strokeWidth={2} />
                <p className="text-sm font-bold text-green-700">تم إرسال التقييم</p>
              </div>
            ) : (
              <>
                {/* Star selector */}
                <div className="mb-3 flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="rounded p-1 transition-transform hover:scale-110"
                      aria-label={`${n} نجوم`}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          n <= displayed
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب تعليقاً (اختياري)"
                  maxLength={1000}
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />

                {error && (
                  <p className="mt-2 text-xs text-red-500">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy || rating < 1}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Star className="h-4 w-4" strokeWidth={2.5} fill="currentColor" />
                      <span>إرسال التقييم</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
