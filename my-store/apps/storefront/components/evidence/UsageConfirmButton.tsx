"use client";

import { useState } from "react";
import { CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { logEvidence, generateSessionId } from "@/lib/evidence";

interface UsageConfirmButtonProps {
  orderId: string;
  customerId: string;
  productId: string;
  alreadyConfirmed?: boolean;
}

export function UsageConfirmButton({
  orderId,
  customerId,
  productId,
  alreadyConfirmed = false,
}: UsageConfirmButtonProps) {
  const [confirmed, setConfirmed] = useState(alreadyConfirmed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/usage-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerId,
          productId,
          sessionId: generateSessionId(),
        }),
      });

      if (!res.ok) throw new Error("فشل تأكيد الاستخدام");

      setConfirmed(true);
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-bold text-green-800">
            تم تأكيد الاستلام والاستخدام
          </p>
          <p className="text-xs text-green-600">
            شكراً لتأكيدك — تم تسجيل البيانات بنجاح
          </p>
        </div>
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
      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}
      <p className="text-center text-xs text-gray-400">
        بالضغط على هذا الزر، تؤكد أنك استلمت المنتج وقمت باستخدامه بنجاح.
        سيتم تسجيل هذا التأكيد كإثبات.
      </p>
    </div>
  );
}
