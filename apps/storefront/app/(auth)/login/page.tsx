"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "@/components/ui/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, RefreshCw, KeyRound } from "lucide-react";
import { useT } from "@/lib/i18n";

// All user-facing copy for this page. Kept as a plain object rather
// than nested in useT() because there are ~30 strings and centralizing
// them here is easier to scan than sprinkling ternaries.
function loginCopy(isEn: boolean) {
  return {
    verified:      isEn ? "✓ Your email is confirmed, you can sign in now" : "✓ تم تأكيد بريدك الإلكتروني، يمكنك تسجيل الدخول الآن",
    registered:    isEn ? "📧 Account created! Check your email to confirm your account before signing in" : "📧 تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول",
    linkExpired:   isEn ? "⚠️ Verification link expired. Sign in and we'll send you a new one" : "⚠️ انتهت صلاحية رابط التحقق. سجّل الدخول وسنرسل لك رابطاً جديداً",
    invalidCreds:  isEn ? "Incorrect email or password" : "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    rateLimited:   isEn ? "You requested a code recently. Please wait a moment before trying again" : "لقد طلبت رمزاً مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى",
    sendFailed:    isEn ? "Couldn't send the code. Check your connection and try again" : "تعذّر إرسال الرمز. تحقق من اتصالك بالإنترنت وحاول مرة أخرى",
    otpInvalid:    isEn ? "Code is incorrect or expired" : "الرمز غير صحيح أو منتهي الصلاحية",
    heading:       isEn ? "Sign in" : "تسجيل الدخول",
    welcomeBack:   isEn ? "Welcome back" : "مرحباً بعودتك",
    tabPassword:   isEn ? "Password" : "كلمة المرور",
    tabOtp:        isEn ? "Verification code" : "رمز التحقق",
    unverifiedTitle: isEn ? "📧 Your email isn't verified yet" : "📧 بريدك الإلكتروني غير مؤكد بعد",
    unverifiedBody:  isEn ? "You need to confirm your email before signing in. Check your inbox and spam folder." : "يجب تأكيد بريدك الإلكتروني قبل تسجيل الدخول. تحقق من صندوق الوارد والبريد المزعج.",
    resendSent:    isEn ? "✓ A new verification link has been sent to your email" : "✓ تم إرسال رابط تحقق جديد إلى بريدك",
    resendLink:    isEn ? "Resend verification link" : "أعد إرسال رابط التحقق",
    emailLabel:    isEn ? "Email" : "البريد الإلكتروني",
    passwordLabel: isEn ? "Password" : "كلمة المرور",
    signInBtn:     isEn ? "Sign in" : "تسجيل الدخول",
    otpHint:       isEn ? "We'll send a 6-digit code to your email. No password needed." : "سنرسل لك رمزاً مؤلفاً من ٦ أرقام إلى بريدك الإلكتروني. لا حاجة لكلمة مرور.",
    sendCode:      isEn ? "Send code" : "إرسال الرمز",
    otpSentPrefix: isEn ? "📧 We sent a 6-digit code to " : "📧 أرسلنا رمزاً مؤلفاً من ٦ أرقام إلى ",
    otpSentSuffix: isEn ? "." : ".",
    otpCheckInbox: isEn ? "Check your inbox (spam folder too, sometimes)." : "تفقّد صندوق الوارد (وملف الرسائل غير المرغوب فيها أحياناً).",
    otpCodeLabel:  isEn ? "Verification code" : "رمز التحقق",
    confirmSignIn: isEn ? "Confirm sign in" : "تأكيد الدخول",
    changeEmail:   isEn ? "← Change email" : "← تغيير البريد",
    resendCodeCd:  (secs: number) => isEn ? `Resend code (${secs})` : `أعد إرسال الرمز (${secs})`,
    resendCode:    isEn ? "Resend code" : "أعد إرسال الرمز",
    or:            isEn ? "or" : "أو",
    signInGoogle:  isEn ? "Sign in with Google" : "الدخول بحساب Google",
    noAccount:     isEn ? "Don't have an account?" : "ليس لديك حساب؟",
    createAccount: isEn ? "Create account" : "إنشاء حساب",
  };
}

function StatusNotices({ M }: { M: ReturnType<typeof loginCopy> }) {
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "true";
  const justVerified = params.get("verified") === "true";
  const linkExpired = params.get("error") === "link-expired";

  if (justVerified) {
    return <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{M.verified}</div>;
  }
  if (justRegistered) {
    return <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{M.registered}</div>;
  }
  if (linkExpired) {
    return <div className="mb-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">{M.linkExpired}</div>;
  }
  return null;
}

export default function LoginPage() {
  const { isEn, dir } = useT();
  const M = loginCopy(isEn);

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
      setError(M.invalidCreds);
      setPwLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError(M.invalidCreds);
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
        setError(M.rateLimited);
        setOtpLoading(false);
        return;
      }
      setOtpStep("code");
      setOtpResendCooldown(60);
    } catch {
      setError(M.sendFailed);
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
      setError(M.otpInvalid);
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
    <div className="w-full" dir={dir}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-brand-800">{M.heading}</h1>
        <p className="mt-1 text-sm text-gray-500">{M.welcomeBack}</p>
      </div>

      <div className="brand-card">
        <Suspense>
          <StatusNotices M={M} />
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
            {M.tabPassword}
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
            {M.tabOtp}
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
                <p className="font-bold">{M.unverifiedTitle}</p>
                <p className="mt-1 text-xs text-amber-700">
                  {M.unverifiedBody}
                </p>
                {resendSent ? (
                  <p className="mt-2 text-xs font-bold text-green-700">{M.resendSent}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
                  >
                    {resendLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {M.resendLink}
                  </button>
                )}
              </div>
            )}

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
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">{M.passwordLabel}</label>
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
              {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : M.signInBtn}
            </button>
          </form>
        )}

        {/* ── OTP method ── */}
        {method === "otp" && otpStep === "email" && (
          <form onSubmit={handleOtpRequest} className="space-y-4">
            <p className="rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-700">
              {M.otpHint}
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
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" disabled={otpLoading || !email} className="brand-btn w-full py-3 disabled:opacity-50">
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : M.sendCode}
            </button>
          </form>
        )}

        {method === "otp" && otpStep === "code" && (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-700">
              {M.otpSentPrefix}<span dir="ltr" className="font-bold">{email}</span>{M.otpSentSuffix}
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
              disabled={otpLoading || otpCode.length !== 6}
              className="brand-btn w-full py-3 disabled:opacity-50"
            >
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : M.confirmSignIn}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setOtpStep("email"); setOtpCode(""); setError(""); }}
                className="text-brand-500 underline hover:text-brand-700"
              >
                {M.changeEmail}
              </button>
              <button
                type="button"
                onClick={handleOtpResend}
                disabled={otpResendCooldown > 0}
                className="text-brand-500 underline hover:text-brand-700 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                {otpResendCooldown > 0 ? M.resendCodeCd(otpResendCooldown) : M.resendCode}
              </button>
            </div>
          </form>
        )}

        {/* ── Google OAuth (always available) ── */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-100" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">{M.or}</span></div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-100 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          {M.signInGoogle}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {M.noAccount}{" "}
          <Link href="/register" className="font-bold text-brand-500 hover:underline">{M.createAccount}</Link>
        </p>
      </div>
    </div>
  );
}
