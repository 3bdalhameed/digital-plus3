import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, ShoppingBag, MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/payload";

export const metadata = { title: "حسابي" };

async function getLogoUrl(): Promise<string | null> {
  try {
    const settings = await getSettings();
    const raw = (settings as any)?.logo?.url as string | undefined;
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    const cmsOrigin =
      process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
    return `${cmsOrigin}${raw}`;
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const [session, logoUrl] = await Promise.all([auth(), getLogoUrl()]);
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Store logo */}
      <div className="flex justify-center py-2">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="الشعار"
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
