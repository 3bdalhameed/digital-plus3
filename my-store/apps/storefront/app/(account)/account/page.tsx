import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, ShoppingBag, MessageCircle, Shield } from "lucide-react";

export const metadata = { title: "حسابي" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-brand-800">حسابي</h1>

      <div className="brand-card flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          <User className="h-6 w-6 text-brand-500" />
        </div>
        <div>
          <p className="font-bold text-brand-800">{session.user.name}</p>
          <p className="text-sm text-gray-500">{session.user.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: ShoppingBag, label: "طلباتي", href: "/orders", desc: "عرض جميع طلباتك" },
          { icon: MessageCircle, label: "الدعم", href: "/support", desc: "تواصل مع فريق الدعم" },
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
