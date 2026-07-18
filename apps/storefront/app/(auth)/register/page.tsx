"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/ui/link";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t, dir, isEn } = useT();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const M = {
    passwordMismatch: isEn ? "Passwords don't match" : "كلمة المرور غير متطابقة",
    registerFailed:   isEn ? "Failed to create account" : "فشل إنشاء الحساب",
    namePlaceholder:  isEn ? "Your full name" : "اسمك الكامل",
    confirmPassword:  isEn ? "Confirm password" : "تأكيد كلمة المرور",
    haveAccount:      isEn ? "Already have an account?" : "لديك حساب بالفعل؟",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(M.passwordMismatch);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || M.registerFailed);
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full" dir={dir}>
      <h1 className="mb-6 text-center text-2xl font-black text-brand-800">{t("register")}</h1>

      <div className="brand-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-700">{t("fullName")}</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder={M.namePlaceholder}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-700">{t("email")}</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="example@email.com"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-700">{t("password")}</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="••••••••"
                required
                minLength={8}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-700">{M.confirmPassword}</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-brand-200 bg-brand-50 py-3 pr-10 pl-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="••••••••"
                required
                minLength={8}
                dir="ltr"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="brand-btn w-full py-3 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("register")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {M.haveAccount}{" "}
          <Link href="/login" className="font-bold text-brand-500 hover:underline">{t("login")}</Link>
        </p>
      </div>
    </div>
  );
}
