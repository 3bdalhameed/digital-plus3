"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "@/components/ui/link";
import { Shield, Loader2, CheckCircle, Mail } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useLocaleStore } from "@/lib/locale-store";
import { logEvidence } from "@/lib/evidence";
import { formatPrice } from "@/lib/utils";
import { DiscountCodeInput } from "@/components/cart/DiscountCodeInput";

type CheckoutStep = "review" | "payment" | "processing";

/** Payment method the customer picks on the payment step.
 *  - `test`      : dev/test flow that creates the order directly
 *  - `qlic`      : Jordan CliQ — support contacts customer via WhatsApp
 *  - `vodafone`  : Egypt Vodafone Cash — same manual flow */
type PaymentMethod = "test" | "qlic" | "vodafone";

export function CheckoutForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalPrice, totalAfterDiscount, appliedDiscount, clearCart } = useCartStore();
  const { currency: userCurrency, rates, lang } = useLocaleStore();
  const isEn = lang === "en";
  const L = {
    stepReview:      isEn ? "Review"                  : "مراجعة",
    stepPayment:     isEn ? "Payment & confirmation"  : "الدفع والتأكيد",
    reviewTitle:     isEn ? "Order review"            : "مراجعة الطلب",
    quantity:        isEn ? "Quantity"                : "الكمية",
    subtotal:        isEn ? "Subtotal"                : "المجموع الفرعي",
    discount:        isEn ? "Discount"                : "خصم",
    total:           isEn ? "Total"                   : "المجموع",
    continueToPay:   isEn ? "Continue to payment"     : "متابعة إلى الدفع",
    choosePayment:   isEn ? "Choose payment method"   : "اختر طريقة الدفع",
    testMode:        isEn ? "Test mode"               : "وضع الاختبار",
    testModeBody:    isEn ? "Order will be created directly without going through the payment gateway." : "سيتم إنشاء الطلب مباشرة دون مرور على بوابة الدفع",
    cliqTitle:       isEn ? "CliQ — Jordan"           : "CliQ — الأردن",
    manualBody:      isEn ? "A support rep will contact you via WhatsApp to complete payment." : "سيتواصل معك أحد ممثلي الدعم عبر واتساب لإتمام الدفع",
    vodafoneTitle:   isEn ? "Vodafone Cash — Egypt"   : "فودافون كاش — مصر",
    contactLabel:    isEn ? "Contact number (WhatsApp)" : "رقم التواصل (واتساب)",
    contactHint:     isEn ? "Support will use this number to send payment instructions." : "سيتم استخدام هذا الرقم من قبل الدعم لإرسال تعليمات الدفع",
    termsHeading:    isEn ? "Terms & Conditions"      : "الشروط والأحكام",
    agreeTo:         isEn ? "I agree to the "         : "أوافق على ",
    termsLink:       isEn ? "Terms & Conditions"      : "الشروط والأحكام",
    andWord:         isEn ? " and the "               : " و ",
    refundLink:      isEn ? "Refund Policy"           : "سياسة الاسترداد",
    disclaimer:      isEn ? ". I understand that digital products are non-refundable after delivery and use." : ". أفهم أن المنتجات الرقمية غير قابلة للاسترداد بعد التسليم والاستخدام.",
    confirmOrder:    isEn ? "Confirm order"           : "تأكيد الطلب",
    processing:      isEn ? "Processing payment..."   : "جاري معالجة الدفع...",
    dontClose:       isEn ? "Please don't close this page." : "يرجى عدم إغلاق هذه الصفحة",
    mustAcceptTerms: isEn ? "You must accept the Terms & Conditions" : "يجب الموافقة على الشروط والأحكام",
    pageTitle:       isEn ? "Checkout"                : "إتمام الشراء",
    contactEmailLabel: isEn ? "Additional contact email (optional)" : "بريد إلكتروني إضافي للتواصل (اختياري)",
    contactEmailPh:    isEn ? "you@example.com"       : "you@example.com",
    contactEmailHint:  isEn ? "We'll use it to reach you about this order if needed." : "سنستخدمه للتواصل معك بخصوص هذا الطلب عند الحاجة.",
    invalidContactEmail: isEn ? "Please enter a valid email or leave it empty." : "يرجى إدخال بريد صحيح أو تركه فارغاً.",
    activationEmailsTitle: isEn ? "Activation email per product (optional)" : "بريد التفعيل لكل منتج (اختياري)",
    activationEmailsHint:  isEn ? "Since your cart has more than one product, you can send each product's activation to a different email." : "بما أن سلتك تحتوي على أكثر من منتج، يمكنك إرسال تفعيل كل منتج إلى بريد مختلف.",
    activationEmailPh:     isEn ? "activation email for this product" : "بريد تفعيل هذا المنتج",
  };
  const [step, setStep] = useState<CheckoutStep>("review");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("test");
  const [contactPhone, setContactPhone] = useState("");
  // Optional secondary email for support to reach the customer at,
  // independent of the payment method. Stored on the order.
  const [contactEmail, setContactEmail] = useState("");
  // Per-product activation email, keyed by product id. Only surfaced
  // when the cart has more than one product so the customer can send
  // each product's activation to a different email. Stored on the
  // matching order item's delivery_info.
  const [itemEmails, setItemEmails] = useState<Record<string, string>>({});

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
      setError(L.mustAcceptTerms);
      return;
    }
    if ((method === "qlic" || method === "vodafone") && !contactPhone.trim()) {
      setError("يرجى إدخال رقم التواصل");
      return;
    }
    // Secondary email is optional, but if provided it must look valid.
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedContactEmail = contactEmail.trim();
    if (trimmedContactEmail && !emailRe.test(trimmedContactEmail)) {
      setError(L.invalidContactEmail);
      return;
    }
    // Per-item activation emails are optional too; validate any that
    // were filled in.
    const multiItem = items.length > 1;
    for (const it of items) {
      const e = (itemEmails[String(it.product.id)] || "").trim();
      if (e && !emailRe.test(e)) {
        setError(L.invalidContactEmail);
        return;
      }
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
      items: items.map((i) => {
        // The cart now collects per-unit delivery fields into
        // item.deliveryInfo (keyed by field id, with a "#<n>" suffix
        // for units beyond the first). Merge in the optional
        // checkout-level activation email so the order item carries
        // everything support needs to fulfil it.
        const deliveryInfo: Record<string, any> = { ...(i.deliveryInfo || {}) };
        if (multiItem && (itemEmails[String(i.product.id)] || "").trim()) {
          deliveryInfo.activationEmail = itemEmails[String(i.product.id)].trim();
        }
        return {
          productId: String(i.product.id),
          name:      (i.product as any).nameAr ?? i.product.name?.ar ?? "",
          quantity:  Number(i.quantity),
          unitPrice: Number(i.product.price),
          ...(Object.keys(deliveryInfo).length ? { deliveryInfo } : {}),
        };
      }),
      totalAmount: Number(totalAfterDiscount()),
      currency:    items[0]?.product.currency || "USD",
    };
    // Attach discount snapshot so the order history preserves what was
    // applied, and the server can re-validate + increment the counter.
    if (appliedDiscount) {
      commonBody.discountCode   = appliedDiscount.code;
      commonBody.discountAmount = Number(appliedDiscount.amount);
    }
    // Optional secondary contact email → stored on the order.
    if (trimmedContactEmail) {
      commonBody.contactEmail = trimmedContactEmail;
    }
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
        // Server sends a machine-readable `code` on 401 so we can
        // route the user to the right recovery UX instead of just
        // flashing a generic error banner. `invalid_guest` = OTP JWT
        // expired mid-checkout, so clear it and reopen the OTP block
        // on the review step. `anonymous` (no session, no token at
        // all) falls through to the generic error toast.
        if (res.status === 401 && b?.code === "invalid_guest") {
          setGuestToken(null);
          setGuestOtpCode("");
          setGuestOtpSent(false);
          setError(b.error || "رمز الضيف غير صالح أو منتهي");
          setStep("review");
          return;
        }
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
      {/* Page heading -- moved out of the server page shell so it
          flips with the visitor's locale. */}
      <h1 className="text-2xl font-black text-brand-800">{L.pageTitle}</h1>

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
                {s === "review" && L.stepReview}
                {s === "payment" && L.stepPayment}
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
            {L.reviewTitle}
          </h2>
          <div className="space-y-3">
            {items.map((item) => {
              const pid = String(item.product.id);
              return (
              <div
                key={item.product.id}
                className="rounded-xl bg-brand-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-800">
                      {(item.product as any).nameAr ?? item.product.name?.ar ?? ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {L.quantity}: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-600">
                    {formatPrice(
                      item.product.price * item.quantity,
                      item.product.currency,
                      userCurrency,
                      rates,
                      lang
                    )}
                  </span>
                </div>

                {/* Per-product activation email — only when the cart
                    has more than one product. */}
                {items.length > 1 && (
                  <input
                    type="email"
                    dir="ltr"
                    value={itemEmails[pid] || ""}
                    onChange={(e) =>
                      setItemEmails((prev) => ({ ...prev, [pid]: e.target.value }))
                    }
                    placeholder={L.activationEmailPh}
                    className="mt-2 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs text-brand-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-100"
                  />
                )}
              </div>
              );
            })}
          </div>

          {items.length > 1 && (
            <p className="mt-3 text-xs text-gray-500">{L.activationEmailsHint}</p>
          )}
          <div className="mt-4 border-t border-brand-100 pt-4 space-y-3">
            <DiscountCodeInput customerEmail={session?.user?.email || guestEmail || undefined} />
            {appliedDiscount && (
              <>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{L.subtotal}</span>
                  <span style={{ fontFeatureSettings: '"tnum"' }}>
                    {formatPrice(totalPrice(), "USD", userCurrency, rates, lang)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>{L.discount} ({appliedDiscount.code})</span>
                  <span style={{ fontFeatureSettings: '"tnum"' }}>
                    −{formatPrice(appliedDiscount.amount, "USD", userCurrency, rates, lang)}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-brand-800">{L.total}</span>
              <span className="text-xl font-extrabold text-brand-600" style={{ fontFeatureSettings: '"tnum"' }}>
                {formatPrice(totalAfterDiscount(), "USD", userCurrency, rates, lang)}
              </span>
            </div>
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
            {L.continueToPay}
          </button>
        </div>
      )}

      {/* Step: Payment */}
      {step === "payment" && (
        <div className="brand-card">
          <h2 className="mb-4 text-lg font-bold text-brand-800">{L.choosePayment}</h2>

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
                <p className="text-sm font-bold text-brand-800">{L.testMode}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {L.testModeBody}
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
                <p className="text-sm font-bold text-brand-800">{L.cliqTitle}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {L.manualBody}
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
                <p className="text-sm font-bold text-brand-800">{L.vodafoneTitle}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {L.manualBody}
                </p>
              </div>
            </label>
          </div>

          {/* Contact number — only shown for the manual methods. */}
          {(method === "qlic" || method === "vodafone") && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-brand-800">
                {L.contactLabel} <span className="text-red-500">*</span>
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
                {L.contactHint}
              </p>
            </div>
          )}

          {/* Optional secondary contact email — always shown, not tied
              to a payment method. Stored on the order so support (and
              the status-change email) can reach the customer here too. */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-brand-800">
              {L.contactEmailLabel}
            </label>
            <input
              type="email"
              dir="ltr"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={L.contactEmailPh}
              className="w-full rounded-xl border-2 border-brand-200 bg-white px-4 py-3 text-sm text-brand-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              {L.contactEmailHint}
            </p>
          </div>

          {/* Terms acceptance — inline. Was a separate step before the
              2-step collapse; keeping the same checkbox + phrasing +
              evidence-log signal, just on the same surface as pay. */}
          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-bold text-brand-800">{L.termsHeading}</span>
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs leading-relaxed text-gray-600">
                {L.agreeTo}
                <Link
                  href="/policies/terms"
                  target="_blank"
                  className="font-bold text-brand-500 underline"
                >
                  {L.termsLink}
                </Link>
                {L.andWord}
                <Link
                  href="/policies/refund"
                  target="_blank"
                  className="font-bold text-brand-500 underline"
                >
                  {L.refundLink}
                </Link>
                {L.disclaimer}
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
              `${L.confirmOrder} — ${formatPrice(totalAfterDiscount(), "USD", userCurrency, rates, lang)}`
            )}
          </button>
        </div>
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <div className="brand-card py-12 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-500" />
          <h2 className="mt-4 text-lg font-bold text-brand-800">
            {L.processing}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {L.dontClose}
          </p>
        </div>
      )}
    </div>
  );
}
