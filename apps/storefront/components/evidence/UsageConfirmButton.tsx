"use client";

import { useState } from "react";
import { CheckCircle, Loader2, ShieldCheck, Star } from "lucide-react";
import { logEvidence, generateSessionId } from "@/lib/evidence";

interface UsageConfirmButtonProps {
  orderId: string;
  customerId: string;
  productId: string;
  alreadyConfirmed?: boolean;
}

function StarRating({
  orderId,
  productId,
  onDone,
}: {
  orderId: string;
  productId: string;
  onDone: () => void;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: Number(orderId),
          productId: productId ? Number(productId) : undefined,
          rating: selected,
          reviewText: reviewText.trim() || undefined,
        }),
      });
      if (!res.ok && res.status !== 409) throw new Error();
      setSubmitted(true);
    } catch {
      setError("فشل إرسال التقييم، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <p className="font-bold text-green-800">شكراً على تقييمك!</p>
        <button onClick={onDone} className="mt-2 text-sm text-brand-600 underline">
          إغلاق
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center text-base font-bold text-brand-800">
        قيّم تجربتك مع المنتج
      </h3>

      {/* Stars */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-9 w-9 transition-colors ${
                star <= (hovered || selected)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Review text */}
      {selected > 0 && (
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="أضف تعليقاً (اختياري)..."
          maxLength={1000}
          rows={3}
          className="w-full rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
          dir="rtl"
        />
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="brand-btn flex-1 gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال التقييم"}
        </button>
        <button
          onClick={onDone}
          className="rounded-xl border border-brand-200 px-4 text-sm text-brand-600 hover:bg-brand-50"
        >
          تخطي
        </button>
      </div>
    </div>
  );
}

export function UsageConfirmButton({
  orderId,
  customerId,
  productId,
  alreadyConfirmed = false,
}: UsageConfirmButtonProps) {
  const [step, setStep] = useState<"confirm" | "rate" | "done">(
    alreadyConfirmed ? "done" : "confirm"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/usage-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          productId,
          sessionId: generateSessionId(),
        }),
      });

      if (!res.ok) throw new Error("فشل تأكيد الاستخدام");
      setStep("rate");
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-bold text-green-800">تم تأكيد الاستلام والاستخدام</p>
          <p className="text-xs text-green-600">شكراً لتأكيدك — تم تسجيل البيانات بنجاح</p>
        </div>
      </div>
    );
  }

  if (step === "rate") {
    return (
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-6">
        <div className="mb-4 flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-bold">تم تأكيد الاستلام بنجاح!</span>
        </div>
        <StarRating
          orderId={orderId}
          productId={productId}
          onDone={() => setStep("done")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="brand-btn w-full gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            تأكيد الاستلام والاستخدام
          </>
        )}
      </button>
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      <p className="text-center text-xs text-gray-400">
        بالضغط على هذا الزر، تؤكد أنك استلمت المنتج وقمت باستخدامه بنجاح.
        سيتم تسجيل هذا التأكيد كإثبات.
      </p>
    </div>
  );
}
