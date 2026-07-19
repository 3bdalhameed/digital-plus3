"use client";

import Link from "@/components/ui/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, ShoppingBag, MessageCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/i18n";

/**
 * Renders the account card from the CLIENT session so the greeting
 * always matches the header. Handles the signed-out case itself with
 * a client-side redirect + loading state so a refresh never flashes
 * the /login page underneath the /account URL -- the previous
 * server-side redirect(auth()) approach was racing the cookie decrypt
 * and briefly bouncing to /login before the client re-hydrated.
 */
export function AccountContent({
  logoUrl,
}: {
  logoUrl: string | null;
}) {
  const { t, dir } = useT();
  const { data: session, status } = useSession();
  const router = useRouter();

  // While next-auth is still checking the cookie, render a spinner —
  // don't redirect yet, and don't render the (empty) card either.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const displayName  = session?.user?.name  ?? "";
  const displayEmail = session?.user?.email ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6" dir={dir}>
      {/* The duplicate in-page logo used to render here. Removed --
          the header already shows the brand mark on every page, and
          repeating it inside the account card left a broken/orphan
          logo when the header's sticky styles applied differently
          than the in-page one. `logoUrl` is still accepted as a prop
          so the parent page + call sites don't need to change; if
          another surface ends up needing it we drop it back in. */}
      <h1 className="text-2xl font-black text-brand-800">{t("myAccount")}</h1>

      <div className="brand-card flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          <User className="h-6 w-6 text-brand-500" />
        </div>
        <div>
          <p className="font-bold text-brand-800">{displayName}</p>
          <p className="text-sm text-gray-500">{displayEmail}</p>
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
