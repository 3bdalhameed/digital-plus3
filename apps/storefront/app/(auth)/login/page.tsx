"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "true";
  const justVerified = params.get("verified") === "true";
  const linkExpired = params.get("error") === "link-expired";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-brand-800">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-gray-500">مرحباً بعودتك</p>
      </div>

      <div className="brand-card">
        {justVerified && (
          <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">✓ تم تأكيد بريدك الإلكتروني، يمكنك تسجيل الدخول الآن</div>
        )}
        {justRegistered && !justVerified && (
          <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">📧 تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتأكيد حسابك</div>
        )}
        {linkExpired && (
          <div className="mb-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">⚠️ انتهت صلاحية رابط التحقق. سجّل الدخول وسنرسل لك رابطاً جديداً</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
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

          <button type="submit" disabled={loading} className="brand-btn w-full py-3 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تسجيل الدخول"}
          </button>
        </form>

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
