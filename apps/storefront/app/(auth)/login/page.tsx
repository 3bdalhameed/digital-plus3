"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, RefreshCw, KeyRound } from "lucide-react";

function StatusNotices() {
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "true";
  const justVerified = params.get("verified") === "true";
  const linkExpired = params.get("error") === "link-expired";

  if (justVerified) {
    return <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">✓ تم تأكيد بريدك الإلكتروني، يمكنك تسجيل الدخول الآن</div>;
  }
  if (justRegistered) {
    return <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">📧 تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول</div>;
  }
  if (linkExpired) {
    return <div className="mb-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">⚠️ انتهت صلاحية رابط التحقق. سجّل الدخول وسنرسل لك رابطاً جديداً</div>;
  }
  return null;
}

export default function LoginPage() {
  /* ─── Method tabs ─── */
  const [method, setMethod] = useState<"password" | "otp">("password");

  /* ─── Shared fields ─── */
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  /* ─── Password flow ─── */
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  /* ─── OTP flow ─── */
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Cooldown countdown for "resend code"
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const t = setTimeout(() => setOtpResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendCooldown]);

  // Auto-focus code input when switching to code step
  useEffect(() => {
    if (otpStep === "code") {
      setTimeout(() => codeInputRef.current?.focus(), 50);
    }
  }, [otpStep]);

  /* ─── Password submit ─── */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setError("");
    setUnverified(false);
    setResendSent(false);

    const check = await fetch("/api/auth/pre-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const { status } = await check.json();

    if (status === "email_not_verified") {
      setUnverified(true);
      setPwLoading(false);
      return;
    }
    if (status !== "ok") {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setPwLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setPwLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendLoading(false);
    setResendSent(true);
  };

  /* ─── OTP: request code ─── */
  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setOtpLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setError("لقد طلبت رمزاً مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى");
        setOtpLoading(false);
        return;
      }
      setOtpStep("code");
      setOtpResendCooldown(60);
    } catch {
      setError("تعذّر إرسال الرمز. تحقق من اتصالك بالإنترنت وحاول مرة أخرى");
    } finally {
      setOtpLoading(false);
    }
  };

  /* ─── OTP: verify code ─── */
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otpCode.length !== 6) return;
    setOtpLoading(true);
    setError("");
    const result = await signIn("otp", { email, code: otpCode, redirect: false });
    if (result?.error) {
      setError("الرمز غير صحيح أو منتهي الصلاحية");
      setOtpLoading(false);
      setOtpCode("");
    } else {
      window.location.href = "/";
    }
  };

  /* ─── OTP: resend ─── */
  const handleOtpResend = async () => {
    if (otpResendCooldown > 0) return;
    setError("");
    await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setOtpResendCooldown(60);
  };

  /* ─── Render ─── */
  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-brand-800">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-gray-500">مرحباً بعودتك</p>
      </div>

      <div className="brand-card">
        <Suspense>
          <StatusNotices />
        </Suspense>

        {/* ── Method tab switcher ── */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-brand-50 p-1">
          <button
            type="button"
            onClick={() => { setMethod("password"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
              method === "password"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-brand-500 hover:text-brand-700"
            }`}
          >
            <Lock className="h-4 w-4" />
            كلمة المرور
          </button>
          <button
            type="button"
            onClick={() => { setMethod("otp"); setError(""); setOtpStep("email"); }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all ${
              method === "otp"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-brand-500 hover:text-brand-700"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            رمز التحقق
          </button>
        </div>

        {/* ── Error notice (shared) ── */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* ── PASSWORD method ── */}
        {method === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {unverified && (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-bold">📧 بريدك الإلكتروني غير مؤكد بعد</p>
                <p className="mt-1 text-xs text-amber-700">
                  يجب تأكيد بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد والبريد المزعج.
                </p>
                {resendSent ? (
                  <p className="mt-2 text-xs font-bold text-green-700">✓ تم إرسال رابط تحقق جديد إلى بريدك</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
                  >
                    {resendLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    أعد إرسال رابط التحقق
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="••••••••"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" disabled={pwLoading} className="brand-btn w-full py-3 disabled:opacity-50">
              {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تسجيل الدخول"}
            </button>
          </form>
        )}

        {/* ── OTP method ── */}
        {method === "otp" && otpStep === "email" && (
          <form onSubmit={handleOtpRequest} className="space-y-4">
            <p className="rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-700">
              سنرسل لك رمزاً مؤلفاً من ٦ أرقام إلى بريدك الإلكتروني. لا حاجة لكلمة مرور.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" disabled={otpLoading || !email} className="brand-btn w-full py-3 disabled:opacity-50">
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الرمز"}
            </button>
          </form>
        )}

        {method === "otp" && otpStep === "code" && (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-700">
              📧 أرسلنا رمزاً مؤلفاً من ٦ أرقام إلى <span dir="ltr" className="font-bold">{email}</span>.
              <br />تفقّد صندوق الوارد (وملف الرسائل غير المرغوب فيها أحياناً).
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">رمز التحقق</label>
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
              disabled={otpLoading || otpCode.length !== 6}
              className="brand-btn w-full py-3 disabled:opacity-50"
            >
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الدخول"}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setOtpStep("email"); setOtpCode(""); setError(""); }}
                className="text-brand-500 underline hover:text-brand-700"
              >
                ← تغيير البريد
              </button>
              <button
                type="button"
                onClick={handleOtpResend}
                disabled={otpResendCooldown > 0}
                className="text-brand-500 underline hover:text-brand-700 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                {otpResendCooldown > 0
                  ? `أعد إرسال الرمز (${otpResendCooldown})`
                  : "أعد إرسال الرمز"}
              </button>
            </div>
          </form>
        )}

        {/* ── Google OAuth (always available) ── */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">أو</span></div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-100 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          الدخول بحساب Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-bold text-brand-500 hover:underline">إنشاء حساب</Link>
        </p>
      </div>
    </div>
  );
}
