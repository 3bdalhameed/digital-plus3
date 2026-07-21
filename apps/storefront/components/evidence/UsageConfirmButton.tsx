"use client";

import { useState } from "react";
import { CheckCircle, Loader2, ShieldCheck, Star } from "lucide-react";
import { logEvidence, generateSessionId } from "@/lib/evidence";
import { useT } from "@/lib/i18n";

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
  const { isEn } = useT();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const L = {
    thanks:    isEn ? "Thanks for your review!" : "شكراً على تقييمك!",
    close:     isEn ? "Close"                   : "إغلاق",
    heading:   isEn ? "Rate your experience with the product" : "قيّم تجربتك مع المنتج",
    commentPh: isEn ? "Add a comment (optional)..." : "أضف تعليقاً (اختياري)...",
    submit:    isEn ? "Submit review"           : "إرسال التقييم",
    skip:      isEn ? "Skip"                    : "تخطي",
    submitErr: isEn ? "Could not submit your review, please try again." : "فشل إرسال التقييم، حاول مرة أخرى",
  };

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
      setError(L.submitErr);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <p className="font-bold text-green-800">{L.thanks}</p>
        <button onClick={onDone} className="mt-2 text-sm text-brand-600 underline">
          {L.close}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center text-base font-bold text-brand-800">
        {L.heading}
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
          placeholder={L.commentPh}
          maxLength={1000}
          rows={3}
          className="w-full rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
          dir={isEn ? "ltr" : "rtl"}
        />
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="brand-btn flex-1 gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : L.submit}
        </button>
        <button
          onClick={onDone}
          className="rounded-xl border border-brand-200 px-4 text-sm text-brand-600 hover:bg-brand-50"
        >
          {L.skip}
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
  const { isEn } = useT();
  const [step, setStep] = useState<"confirm" | "rate" | "done">(
    alreadyConfirmed ? "done" : "confirm"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const L = {
    doneTitle:    isEn ? "Receipt and usage confirmed" : "تم تأكيد الاستلام والاستخدام",
    doneBody:     isEn ? "Thanks for confirming — your record has been saved." : "شكراً لتأكيدك — تم تسجيل البيانات بنجاح",
    rateHeader:   isEn ? "Receipt confirmed successfully!" : "تم تأكيد الاستلام بنجاح!",
    confirmBtn:   isEn ? "Confirm receipt and use"    : "تأكيد الاستلام والاستخدام",
    hint:         isEn ? "By pressing this button you confirm you received the product and used it successfully. This confirmation is stored as evidence."
                       : "بالضغط على هذا الزر، تؤكد أنك استلمت المنتج وقمت باستخدامه بنجاح. سيتم تسجيل هذا التأكيد كإثبات.",
    confirmErr:   isEn ? "Could not confirm usage."   : "فشل تأكيد الاستخدام",
    genericErr:   isEn ? "Something went wrong."      : "حدث خطأ",
  };

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

      if (!res.ok) throw new Error(L.confirmErr);
      setStep("rate");
    } catch (err: any) {
      setError(err.message || L.genericErr);
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-bold text-green-800">{L.doneTitle}</p>
          <p className="text-xs text-green-600">{L.doneBody}</p>
        </div>
      </div>
    );
  }

  if (step === "rate") {
    return (
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-6">
        <div className="mb-4 flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{L.rateHeader}</span>
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
            {L.confirmBtn}
          </>
        )}
      </button>
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      <p className="text-center text-xs text-gray-400">
        {L.hint}
      </p>
    </div>
  );
}
