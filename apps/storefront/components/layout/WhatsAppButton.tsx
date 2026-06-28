import { MessageCircle } from "lucide-react";

/**
 * Floating WhatsApp chat button, fixed to the bottom-LEFT of the viewport.
 *
 * The number comes from SiteSettings.whatsappUrl (a full wa.me link) or
 * SiteSettings.whatsappNumber (a raw phone, in which case we build the URL).
 * If neither is set we fall back to the public support number so the button
 * never silently breaks on a fresh deploy.
 */

const FALLBACK_PHONE = "+962795580312";

function buildWaUrl(opts: { url?: string | null; phone?: string | null }): string {
  if (opts.url && opts.url.startsWith("http")) return opts.url;
  const raw = (opts.phone || FALLBACK_PHONE).replace(/[^\d]/g, "");
  return `https://wa.me/${raw}`;
}

export function WhatsAppButton({
  url,
  phone,
}: {
  url?: string | null;
  phone?: string | null;
}) {
  const href = buildWaUrl({ url, phone });
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-4 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_25px_rgba(37,211,102,0.45)] ring-4 ring-white/70 transition-transform hover:scale-110 active:scale-95 sm:bottom-6 sm:left-6 sm:h-14 sm:w-14"
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2.5} fill="currentColor" />
    </a>
  );
}
