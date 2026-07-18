import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/payload";
import { AccountContent } from "./AccountContent";

export const metadata = { title: "حسابي | My Account" };

// Per-user page. Any caching across requests risks serving one
// visitor's name/email to another (or to a stale version of the same
// visitor after they signed in as a different account). Force a fresh
// SSR every request so the seed passed to AccountContent always
// matches the current cookie's session.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <AccountContent
      userName={session.user.name}
      userEmail={session.user.email}
      logoUrl={logoUrl}
    />
  );
}
