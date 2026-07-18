import { getSettings } from "@/lib/payload";
import { AccountContent } from "./AccountContent";

export const metadata = { title: "حسابي | My Account" };

// Session-aware content lives entirely in the client component so a
// refresh doesn't flash the /login page. Previously the server
// called auth() and redirect("/login") if the cookie wasn't
// decrypted in time -- the client then re-hydrated with the session
// present and bounced back to /account, producing a visible flash.
// Now the server just renders the shell + logo; AccountContent's
// useSession() handles the signed-out state client-side without
// any redirect.
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
  const logoUrl = await getLogoUrl();
  return <AccountContent logoUrl={logoUrl} />;
}
