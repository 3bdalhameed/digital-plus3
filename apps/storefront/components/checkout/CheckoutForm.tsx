"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Shield, Loader2, CheckCircle } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { logEvidence } from "@/lib/evidence";
import { formatPrice } from "@/lib/utils";

type CheckoutStep = "review" | "terms" | "payment" | "processing";

export function CheckoutForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState<CheckoutStep>("review");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptTerms = async () => {
    if (!termsAccepted || !session?.user?.id) return;

    setLoading(true);
    // Fire-and-forget: evidence logging should never block checkout
    logEvidence({
      type: "terms_acceptance",
      data: {
        acceptedAt: new Date().toISOString(),
        cartItems: items.map((i) => ({
          productId: i.product.id,
          name: (i.product as any).nameAr ?? i.product.name?.ar ?? "",
          quantity: i.quantity,
          price: i.product.price,
        })),
        totalAmount: totalPrice(),
      },
    }).catch(() => {});
    setStep("payment");
    setLoading(false);
  };

  const handleCreatePayment = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setStep("processing");
    setError(null);

    try {
      const res = await fetch("/api/checkout/test-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: String(i.product.id),
            name: (i.product as any).nameAr ?? i.product.name?.ar ?? "",
            quantity: Number(i.quantity),
            unitPrice: Number(i.product.price),
          })),
          totalAmount: Number(totalPrice()),
          currency: items[0]?.product.currency || "USD",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "فشل إنشاء الطلب");
      }

      const { orderId } = await res.json();
      clearCart();
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الدفع");
      setStep("payment");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="brand-card py-12 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="brand-card py-12 text-center">
        <h2 className="text-xl font-bold text-brand-800">
          يجب تسجيل الدخول أولاً
        </h2>
        <Link href="/login" className="brand-btn mt-4 inline-block">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="brand-card py-12 text-center">
        <h2 className="text-xl font-bold text-brand-800">سلة التسوق فارغة</h2>
        <Link href="/products" className="brand-btn mt-4 inline-block">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="brand-card">
        <div className="flex items-center justify-center gap-4 text-sm">
          {(["review", "terms", "payment"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step === s || (["review", "terms", "payment"].indexOf(step) > i)
                    ? "bg-brand-500 text-white"
                    : "bg-brand-100 text-brand-400"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={
                  step === s ? "font-bold text-brand-600" : "text-gray-400"
                }
              >
                {s === "review" && "مراجعة"}
                {s === "terms" && "الشروط"}
                {s === "payment" && "الدفع"}
              </span>
              {i < 2 && (
                <div className="mx-2 h-px w-8 bg-brand-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="brand-card">
          <h2 className="mb-4 text-lg font-bold text-brand-800">
            مراجعة الطلب
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between rounded-xl bg-brand-50 p-3"
              >
                <div>
                  <p className="text-sm font-bold text-brand-800">
                    {(item.product as any).nameAr ?? item.product.name?.ar ?? ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    الكمية: {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-600">
                  {formatPrice(
                    item.product.price * item.quantity,
                    item.product.currency
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-4">
            <span className="text-lg font-bold text-brand-800">المجموع</span>
            <span className="text-xl font-extrabold text-brand-600">
              {formatPrice(totalPrice())}
            </span>
          </div>
          <button
            onClick={() => setStep("terms")}
            className="brand-btn mt-6 w-full"
          >
            متابعة
          </button>
        </div>
      )}

      {/* Step: Terms */}
      {step === "terms" && (
        <div className="brand-card">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand-500" />
            <h2 className="text-lg font-bold text-brand-800">
              الشروط والأحكام
            </h2>
          </div>

          <div className="mb-6 max-h-48 overflow-y-auto rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-relaxed text-gray-600">
            <p>
              بإتمام عملية الشراء، أنت توافق على الشروط والأحكام وسياسة الاسترداد
              الخاصة بنا. المنتجات الرقمية يتم تسليمها إلكترونياً ولا يمكن
              استردادها بعد التسليم والاستخدام. يرجى قراءة{" "}
              <Link
                href="/policies/terms"
                target="_blank"
                className="font-bold text-brand-500 underline"
              >
                الشروط والأحكام
              </Link>{" "}
              و{" "}
              <Link
                href="/policies/refund"
                target="_blank"
                className="font-bold text-brand-500 underline"
              >
                سياسة الاسترداد
              </Link>{" "}
              بعناية قبل المتابعة.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-200 p-4 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-brand-800">
              أوافق على{" "}
              <span className="font-bold text-brand-600">
                الشروط والأحكام وسياسة الاسترداد
              </span>
              . أفهم أن المنتجات الرقمية غير قابلة للاسترداد بعد التسليم
              والاستخدام.
            </span>
          </label>

          <button
            onClick={handleAcceptTerms}
            disabled={!termsAccepted || loading}
            className="brand-btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "الموافقة والمتابعة للدفع"
            )}
          </button>
        </div>
      )}

      {/* Step: Payment */}
      {step === "payment" && (
        <div className="brand-card">
          <h2 className="mb-4 text-lg font-bold text-brand-800">الدفع</h2>
          <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-sm font-semibold text-amber-700">وضع الاختبار</p>
            <p className="mt-1 text-xs text-amber-600">
              سيتم إنشاء الطلب مباشرة دون مرور على بوابة الدفع
            </p>
          </div>

          <button
            onClick={handleCreatePayment}
            disabled={loading}
            className="brand-btn mt-6 w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `تأكيد الطلب — ${formatPrice(totalPrice())}`
            )}
          </button>
        </div>
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <div className="brand-card py-12 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-500" />
          <h2 className="mt-4 text-lg font-bold text-brand-800">
            جاري معالجة الدفع...
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            يرجى عدم إغلاق هذه الصفحة
          </p>
        </div>
      )}
    </div>
  );
}
