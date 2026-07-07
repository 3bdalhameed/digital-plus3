"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Shield, Loader2, CheckCircle, Mail } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { logEvidence } from "@/lib/evidence";
import { formatPrice } from "@/lib/utils";

type CheckoutStep = "review" | "payment" | "processing";

/** Payment method the customer picks on the payment step.
 *  - `test`      : dev/test flow that creates the order directly
 *  - `qlic`      : Jordan CliQ — support contacts customer via WhatsApp
 *  - `vodafone`  : Egypt Vodafone Cash — same manual flow */
type PaymentMethod = "test" | "qlic" | "vodafone";

export function CheckoutForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState<CheckoutStep>("review");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("test");
  const [contactPhone, setContactPhone] = useState("");

  // Guest-checkout state. Only used when there's no NextAuth session.
  // Once `guestToken` is set the user is treated as "verified" and can
  // move to the payment step exactly like a logged-in user.
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName,  setGuestName]  = useState("");
  const [guestOtpCode,    setGuestOtpCode]  = useState("");
  const [guestOtpSent,    setGuestOtpSent]  = useState(false);
  const [guestToken,      setGuestToken]    = useState<string | null>(null);
  const [guestBusy,       setGuestBusy]     = useState(false);

  const isGuest    = !session?.user?.id;
  const isVerified = !!session?.user?.id || !!guestToken;

  const handleRequestOtp = async () => {
    setError(null);
    if (!guestEmail.trim() || !guestEmail.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صالح");
      return;
    }
    setGuestBusy(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail.trim() }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        if (b?.error === "rate_limited") {
          setError("يرجى الانتظار دقيقة قبل إعادة الطلب");
        } else {
          setError("تعذر إرسال الرمز، حاول مرة أخرى");
        }
        return;
      }
      setGuestOtpSent(true);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setGuestBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!/^\d{6}$/.test(guestOtpCode.trim())) {
      setError("الرمز يجب أن يتكون من 6 أرقام");
      return;
    }
    setGuestBusy(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail.trim(), code: guestOtpCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        setError("الرمز غير صحيح أو منتهي");
        return;
      }
      setGuestToken(data.token);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setGuestBusy(false);
    }
  };

  const handleCreatePayment = async () => {
    // Either a real session OR a verified guest token is required.
    if (!isVerified) return;

    // Client-side guards — server re-validates, but a friendly inline
    // error avoids a round-trip.
    if (!termsAccepted) {
      setError("يجب الموافقة على الشروط والأحكام");
      return;
    }
    if ((method === "qlic" || method === "vodafone") && !contactPhone.trim()) {
      setError("يرجى إدخال رقم التواصل");
      return;
    }

    // Fire-and-forget evidence log — terms acceptance now happens on
    // the same step as payment confirmation, so log it here just
    // before we submit the order. Never blocks checkout.
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
        paymentMethod: method,
      },
    }).catch(() => {});

    setLoading(true);
    setStep("processing");
    setError(null);

    const commonBody: Record<string, any> = {
      items: items.map((i) => ({
        productId: String(i.product.id),
        name:      (i.product as any).nameAr ?? i.product.name?.ar ?? "",
        quantity:  Number(i.quantity),
        unitPrice: Number(i.product.price),
      })),
      totalAmount: Number(totalPrice()),
      currency:    items[0]?.product.currency || "USD",
    };
    // Guests attach the token they got from /api/auth/otp/verify. The
    // server checks NextAuth session first and falls through to this.
    if (isGuest && guestToken) {
      commonBody.guestToken = guestToken;
      if (guestName.trim()) commonBody.guestName = guestName.trim();
    }

    const endpoint = method === "test"
      ? "/api/checkout/test-pay"
      : "/api/checkout/manual-payment";

    const body = method === "test"
      ? commonBody
      : {
          ...commonBody,
          method:       method === "qlic" ? "qlic" : "vodafone_cash",
          contactPhone: contactPhone.trim(),
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "فشل إنشاء الطلب");
      }

      const { orderId } = await res.json();
      clearCart();
      // Manual methods land the customer on success with a `pending=1`
      // flag so the page can show "we'll contact you" copy instead of
      // "your order is being processed" phrasing.
      const pendingParam = method === "test" ? "" : "&pending=1";
      router.push(`/checkout/success?orderId=${orderId}${pendingParam}`);
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

  // NOTE: no more forced-registration gate for `status === "unauthenticated"`.
  // Guest visitors continue to the review step; the inline email+OTP block
  // below vouches for their identity so the checkout endpoints can accept
  // the order without a NextAuth session.

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
      {/* Progress — collapsed from 3 steps to 2. Terms acceptance is
          now inline on the payment step (checkbox above the confirm
          button) so we no longer need a separate terms step. */}
      <div className="brand-card">
        <div className="flex items-center justify-center gap-4 text-sm">
          {(["review", "payment"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  step === s || (["review", "payment"].indexOf(step) > i)
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
                {s === "payment" && "الدفع والتأكيد"}
              </span>
              {i < 1 && <div className="mx-2 h-px w-8 bg-brand-200" />}
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

          {/* Guest identity block — shows only when there's no NextAuth
              session. Two mini-steps: email input → OTP input → verified.
              Once verified, the "متابعة" button unlocks and the guest
              token rides along with every checkout request. */}
          {isGuest && !guestToken && (
            <div className="mt-6 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-500" />
                <span className="text-sm font-bold text-brand-800">
                  متابعة كضيف — تحقق من بريدك الإلكتروني
                </span>
              </div>
              <p className="mb-3 text-xs text-gray-600">
                لست بحاجة لإنشاء حساب. أدخل بريدك الإلكتروني وسنرسل لك رمزاً
                للتأكيد فقط.{" "}
                <Link
                  href="/login"
                  className="font-bold text-brand-500 underline"
                >
                  لديك حساب؟
                </Link>
              </p>

              {!guestOtpSent ? (
                <div className="space-y-2">
                  <input
                    type="email"
                    dir="ltr"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="الاسم (اختياري)"
                    className="w-full rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    onClick={handleRequestOtp}
                    disabled={guestBusy}
                    className="brand-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {guestBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "إرسال رمز التحقق"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    تم إرسال الرمز إلى{" "}
                    <span dir="ltr" className="font-bold text-brand-700">
                      {guestEmail}
                    </span>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={6}
                    value={guestOtpCode}
                    onChange={(e) => setGuestOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="XXXXXX"
                    className="w-full rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-center text-lg font-black tracking-widest text-brand-800 placeholder:text-gray-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyOtp}
                      disabled={guestBusy}
                      className="brand-btn flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {guestBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "تحقق"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setGuestOtpSent(false);
                        setGuestOtpCode("");
                      }}
                      className="rounded-xl border-2 border-brand-200 bg-white px-4 text-sm font-bold text-brand-600 hover:bg-brand-50"
                    >
                      تغيير البريد
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isGuest && guestToken && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 p-4 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700">
                تم التحقق من{" "}
                <span dir="ltr" className="font-bold">
                  {guestEmail}
                </span>
              </span>
            </div>
          )}

          <button
            onClick={() => setStep("payment")}
            disabled={!isVerified}
            className="brand-btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            متابعة إلى الدفع
          </button>
        </div>
      )}

      {/* Step: Payment */}
      {step === "payment" && (
        <div className="brand-card">
          <h2 className="mb-4 text-lg font-bold text-brand-800">اختر طريقة الدفع</h2>

          <div className="space-y-3">
            {/* Test / default flow — kept behind a small dev-mode badge
                until the gateway is wired. Selects by default. */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-200 p-4 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                name="pay-method"
                value="test"
                checked={method === "test"}
                onChange={() => setMethod("test")}
                className="mt-1 h-5 w-5 text-brand-500 focus:ring-brand-500"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-800">وضع الاختبار</p>
                <p className="mt-1 text-xs text-gray-500">
                  سيتم إنشاء الطلب مباشرة دون مرور على بوابة الدفع
                </p>
              </div>
            </label>

            {/* Jordan CliQ — manual payment, support follows up */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-200 p-4 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                name="pay-method"
                value="qlic"
                checked={method === "qlic"}
                onChange={() => setMethod("qlic")}
                className="mt-1 h-5 w-5 text-brand-500 focus:ring-brand-500"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-800">CliQ — الأردن</p>
                <p className="mt-1 text-xs text-gray-500">
                  سيتواصل معك أحد ممثلي الدعم عبر واتساب لإتمام الدفع
                </p>
              </div>
            </label>

            {/* Egypt Vodafone Cash — manual payment, support follows up */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-200 p-4 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                name="pay-method"
                value="vodafone"
                checked={method === "vodafone"}
                onChange={() => setMethod("vodafone")}
                className="mt-1 h-5 w-5 text-brand-500 focus:ring-brand-500"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-800">فودافون كاش — مصر</p>
                <p className="mt-1 text-xs text-gray-500">
                  سيتواصل معك أحد ممثلي الدعم عبر واتساب لإتمام الدفع
                </p>
              </div>
            </label>
          </div>

          {/* Contact number — only shown for the manual methods. */}
          {(method === "qlic" || method === "vodafone") && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-brand-800">
                رقم التواصل (واتساب) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+9627XXXXXXXX"
                className="w-full rounded-xl border-2 border-brand-200 bg-white px-4 py-3 text-sm text-brand-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                سيتم استخدام هذا الرقم من قبل الدعم لإرسال تعليمات الدفع
              </p>
            </div>
          )}

          {/* Terms acceptance — inline. Was a separate step before the
              2-step collapse; keeping the same checkbox + phrasing +
              evidence-log signal, just on the same surface as pay. */}
          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-bold text-brand-800">الشروط والأحكام</span>
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs leading-relaxed text-gray-600">
                أوافق على{" "}
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
                </Link>
                . أفهم أن المنتجات الرقمية غير قابلة للاسترداد بعد التسليم والاستخدام.
              </span>
            </label>
          </div>

          <button
            onClick={handleCreatePayment}
            disabled={loading || !termsAccepted}
            className="brand-btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
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
