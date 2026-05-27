import { permanentRedirect } from "next/navigation";

/**
 * Legacy /category/[slug] route — kept as a permanent redirect so any
 * old bookmarks, external backlinks, and search-engine results keep
 * working. New canonical URL is /collections/<slug>.
 */
export default function LegacyCategoryRedirect({ params }: { params: { slug: string } }) {
  permanentRedirect(`/collections/${params.slug}`);
}
