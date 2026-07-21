import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import {
  getCategoryBySlug,
  getSubcategoryBySlug,
  getProducts,
  getSubcategories,
} from "@/lib/payload";
import { CollectionView } from "./CollectionView";

// Category/subcategory listing — 3 min. Reordering + new products
// surface on the next window.
export const revalidate = 180;

/**
 * Unified "collection" page handling BOTH categories AND subcategories.
 *
 *   /collections/<category-slug>     →  category page (subcategories grid + products)
 *   /collections/<subcategory-slug>  →  subcategory page (filtered products)
 *
 * Categories take precedence on slug collision (they're the primary nav).
 * Falls back to subcategory if no category matches that slug.
 *
 * Data fetching + auth happens here; all user-facing copy (headings,
 * empty states, pagination labels) is rendered by CollectionView on
 * the client so the visitor's locale-store setting can drive it.
 */
export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;

  // Reading draftMode opts this page out of ISR caching when an
  // editor is previewing the collection from the Payload admin —
  // so they always see the latest unpublished edits.
  const { isEnabled: isPreview } = draftMode();
  void isPreview;

  /* Try category first */
  const category = await getCategoryBySlug(params.slug).catch(() => null);
  if (category) {
    const [products, subcategories] = await Promise.all([
      getProducts({ category: params.slug, page }).catch(() => ({
        docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false,
      })),
      getSubcategories(params.slug).catch(() => []),
    ]);
    return (
      <CollectionView
        variant="category"
        slug={params.slug}
        category={category}
        subcategories={subcategories as any[]}
        products={products as any}
      />
    );
  }

  /* Fall through to subcategory */
  const subcategory = await getSubcategoryBySlug(params.slug).catch(() => null);
  if (subcategory) {
    const products = await getProducts({ subcategory: params.slug, page }).catch(() => ({
      docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false,
    }));
    return (
      <CollectionView
        variant="subcategory"
        slug={params.slug}
        subcategory={subcategory}
        products={products as any}
      />
    );
  }

  notFound();
}
