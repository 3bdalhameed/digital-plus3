import type { ReactNode } from "react";

/**
 * Storefront-hosted admin area (currently: review moderation).
 * Kept out of the (shop) route group so it doesn't pull the shop
 * header/footer -- admin views should feel like a control panel,
 * not a customer-facing page.
 */
export const metadata = { title: "Admin — Digital Plus" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-50/50 p-4 sm:p-8">
      {children}
    </div>
  );
}
