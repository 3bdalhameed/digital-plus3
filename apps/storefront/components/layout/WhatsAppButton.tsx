/**
 * Floating WhatsApp chat button, fixed to the bottom-RIGHT of the viewport.
 *
 * The number comes from SiteSettings.whatsappUrl (a full wa.me link) or
 * SiteSettings.whatsappNumber (a raw phone, in which case we build the URL).
 * If neither is set we fall back to the public support number so the button
 * never silently breaks on a fresh deploy.
 *
 * Uses the official WhatsApp glyph (inline SVG) rather than a generic chat
 * bubble so the brand is unmistakable at small sizes.
 */

const FALLBACK_PHONE = "+962795580312";

function buildWaUrl(opts: { url?: string | null; phone?: string | null }): string {
  if (opts.url && opts.url.startsWith("http")) return opts.url;
  const raw = (opts.phone || FALLBACK_PHONE).replace(/[^\d]/g, "");
  return `https://wa.me/${raw}`;
}

/** Official WhatsApp glyph — single-color, sized via `currentColor`. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.003 3C9.376 3 4 8.376 4 15.003c0 2.34.671 4.526 1.83 6.378L4 29l7.793-1.806A11.94 11.94 0 0 0 16.003 27C22.63 27 28 21.624 28 15.003 28 8.376 22.63 3 16.003 3Zm0 21.84c-1.984 0-3.83-.554-5.4-1.51l-.388-.232-4.625 1.073 1.092-4.504-.252-.412a9.832 9.832 0 0 1-1.555-5.252c0-5.443 4.43-9.872 9.876-9.872 2.638 0 5.115 1.027 6.98 2.892a9.806 9.806 0 0 1 2.892 6.98c0 5.443-4.43 9.836-9.872 9.836Zm5.418-7.357c-.296-.148-1.755-.866-2.027-.964-.272-.099-.47-.148-.668.148-.198.296-.766.964-.94 1.163-.173.198-.347.222-.643.074-.296-.148-1.252-.461-2.385-1.47-.88-.785-1.474-1.755-1.647-2.052-.173-.296-.018-.456.13-.604.133-.133.296-.347.444-.52.148-.173.198-.296.296-.495.099-.198.05-.371-.025-.52-.074-.148-.668-1.608-.915-2.2-.241-.578-.487-.5-.668-.51l-.57-.01c-.198 0-.52.074-.792.371-.272.296-1.04 1.016-1.04 2.476s1.065 2.872 1.213 3.07c.148.198 2.094 3.198 5.075 4.487.71.306 1.263.49 1.695.628.712.226 1.36.194 1.872.118.572-.085 1.755-.717 2.003-1.41.248-.692.248-1.287.173-1.41-.074-.124-.272-.198-.568-.346Z" />
    </svg>
  );
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
      className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_25px_rgba(37,211,102,0.45)] ring-4 ring-white/70 transition-transform hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <WhatsAppGlyph className="h-8 w-8" />
    </a>
  );
}
