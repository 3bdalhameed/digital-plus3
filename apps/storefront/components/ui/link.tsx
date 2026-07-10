import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Storefront-wide Link wrapper that defaults `prefetch={false}`.
 *
 * Next.js's App Router `<Link>` background-fetches each destination's
 * RSC payload on hover. On a slow origin those prefetches are 200-300 KB
 * requests that stall for ~2 seconds each — and Cloudflare can't cache
 * them (Vary headers + per-request `?_rsc=<hash>` query keys). Turning
 * prefetch off makes hover a no-op and defers all fetching to the actual
 * click, which is already fast enough (~700 ms TTFB warm).
 *
 * Any individual Link can still opt back in with `prefetch={true}` on
 * a case-by-case basis if it's genuinely a hot navigation path.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  const { prefetch = false, ...rest } = props;
  return <NextLink prefetch={prefetch} {...rest} />;
}
