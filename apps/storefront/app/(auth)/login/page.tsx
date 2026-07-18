"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * OTP-only login. Password path removed after we couldn't make the
 * bcrypt credentials flow behave reliably behind the Cloudflare /
 * Coolify proxy chain (MissingCSRF ping-ponging). OTP works because
 * the code lives in the DB and the sign-in POST doesn't rely on a
 * pre-existing csrf cookie round-trip in the same way.
 *
 * Flow:
 *   1. User types email → POST /api/auth/otp/request → 6-digit code emailed
 *   2. User types code → signIn("otp", { email, code }) → session set → redirect /
 *
 * Accounts are auto-created on first successful OTP verify inside the
 * auth "otp" provider, so this doubles as registration -- no separate
 * /register page needed.
 */

function loginCopy(isEn: boolean) {
  return {
    heading:       isEn ? "Sign in"                          : "تسجيل الدخول",
    welcomeBack:   isEn ? "Enter your email to receive a login code" : "أدخل بريدك الإلكتروني لتلقي رمز الدخول",
    emailLabel:    isEn ? "Email"                            : "البريد الإلكتروني",
    sendCode:      isEn ? "Send code"                        : "إرسال الرمز",
    otpSentPrefix: isEn ? "📧 Code sent to "                  : "📧 تم إرسال الرمز إلى ",
    otpCheckInbox: isEn ? "Check your inbox (spam folder too, sometimes)." : "تفقّد صندوق الوارد (وملف الرسائل غير المرغوب فيها أحياناً).",
    otpCodeLabel:  isEn ? "Verification code"                : "رمز التحقق",
    confirmSignIn: isEn ? "Confirm sign in"                  : "تأكيد الدخول",
    changeEmail:   isEn ? "← Change email"                    : "← تغيير البريد",
    resendCodeCd:  (secs: number) => isEn ? `Resend code (${secs})` : `أعد إرسال الرمز (${secs})`,
    resendCode:    isEn ? "Resend code"                      : "أعد إرسال الرمز",
    rateLimited:   isEn ? "You requested a code recently. Wait a moment before trying again." : "لقد طلبت رمزاً مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى",
    sendFailed:    isEn ? "Couldn't send the code. Check your connection and try again." : "تعذّر إرسال الرمز. تحقق من اتصالك بالإنترنت وحاول مرة أخرى",
    otpInvalid:    isEn ? "Code is incorrect or expired"     : "الرمز غير صحيح أو منتهي الصلاحية",
    firstTimeHint: isEn ? "New here? Just enter your email — your account will be created automatically." : "جديد هنا؟ أدخل بريدك الإلكتروني وسنقوم بإنشاء حسابك تلقائياً.",
  };
}

function StatusNotices() {
  const params = useSearchParams();
  if (params.get("signedOut") === "1") {
    return (
      <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
        ✓ تم تسجيل الخروج بنجاح
      </div>
    );
  }
  return null;
}

export default function LoginPage() {
  const { isEn, dir } = useT();
  const M = loginCopy(isEn);

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Countdown for the resend timer.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus the code input the moment we switch to the code step.
  useEffect(() => {
    if (step === "code") setTimeout(() => codeInputRef.current?.focus(), 50);
  }, [step]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 429) {
        setError(M.rateLimited);
        return;
      }
      setStep("code");
      setResendCooldown(60);
    } catch {
      setError(M.sendFailed);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6 || loading) return;
    setLoading(true);
    setError("");
    const result = await signIn("otp", { email: email.trim(), code: otpCode, redirect: false });
    if (result?.error) {
      setError(M.otpInvalid);
      setOtpCode("");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="w-full" dir={dir}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-brand-800">{M.heading}</h1>
        <p className="mt-1 text-sm text-gray-500">{M.welcomeBack}</p>
      </div>

      <div className="brand-card">
        <Suspense>
          <StatusNotices />
        </Suspense>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {step === "email" && (
          <form onSubmit={requestCode} className="space-y-4">
            <p className="rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-700">
              {M.firstTimeHint}
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">{M.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="example@email.com"
                  required
                  autoFocus
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="brand-btn w-full py-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : M.sendCode}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-700">
              {M.otpSentPrefix}<span dir="ltr" className="font-bold">{email}</span>.
              <br />{M.otpCheckInbox}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">{M.otpCodeLabel}</label>
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border-2 border-brand-200 bg-white py-4 text-center text-2xl font-black tracking-[0.5em] text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="••••••"
                required
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="brand-btn w-full py-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : M.confirmSignIn}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setStep("email"); setOtpCode(""); setError(""); }}
                className="text-brand-500 underline hover:text-brand-700"
              >
                {M.changeEmail}
              </button>
              <button
                type="button"
                onClick={() => resendCooldown === 0 && requestCode()}
                disabled={resendCooldown > 0}
                className="text-brand-500 underline hover:text-brand-700 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? M.resendCodeCd(resendCooldown) : M.resendCode}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
