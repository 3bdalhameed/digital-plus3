"use client";

import Link from "@/components/ui/link";
import Image from "next/image";
import { User, ShoppingBag, MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export function AccountContent({
  userName,
  userEmail,
  logoUrl,
}: {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  logoUrl: string | null;
}) {
  const { t, dir, isEn } = useT();

  return (
    <div className="mx-auto max-w-2xl space-y-6" dir={dir}>
      {/* Store logo */}
      <div className="flex justify-center py-2">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={isEn ? "Logo" : "الشعار"}
            width={140}
            height={48}
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9333EA]">
            <span className="text-xl font-black text-white">+</span>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-black text-brand-800">{t("myAccount")}</h1>

      <div className="brand-card flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          <User className="h-6 w-6 text-brand-500" />
        </div>
        <div>
          <p className="font-bold text-brand-800">{userName}</p>
          <p className="text-sm text-gray-500">{userEmail}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: ShoppingBag,   label: t("myOrders"), href: "/orders",  desc: t("myOrdersHint") },
          { icon: MessageCircle, label: t("support"),  href: "/support", desc: t("supportHint") },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="brand-card flex items-center gap-4 transition-shadow hover:shadow-card-hover">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <item.icon className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
