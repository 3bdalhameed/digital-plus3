import { getProducts, getCategories } from "@/lib/payload";
import { ProductsView } from "./ProductsView";

export const metadata = { title: "المنتجات | Products" };
// 3 min — listing changes when new products publish; not price-sensitive.
export const revalidate = 180;

interface Props {
  searchParams: {
    /** Kept for legacy URLs (?category=...) — new flow uses /collections/<slug> */
    category?: string;
    /** Kept for legacy URLs — new flow uses /collections/<slug> */
    subcategory?: string;
    type?: string;
    page?: string;
    q?: string;
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const [productsData, categories] = await Promise.all([
    getProducts({
      category: searchParams.category,
      subcategory: searchParams.subcategory,
      type: searchParams.type,
      q: searchParams.q,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
    }).catch(() => ({ docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false })),
    getCategories().catch(() => []),
  ]);

  // Build a persistent query string for pagination links (preserves all active filters)
  const baseParams = new URLSearchParams();
  if (searchParams.category) baseParams.set("category", searchParams.category);
  if (searchParams.subcategory) baseParams.set("subcategory", searchParams.subcategory);
  if (searchParams.q) baseParams.set("q", searchParams.q);
  const baseQuery = baseParams.toString();

  return (
    <ProductsView
      docs={productsData.docs}
      totalPages={productsData.totalPages}
      page={productsData.page}
      totalDocs={productsData.totalDocs}
      hasNextPage={productsData.hasNextPage}
      hasPrevPage={productsData.hasPrevPage}
      categories={categories}
      searchQuery={searchParams.q}
      categoryFilter={searchParams.category}
      baseQuery={baseQuery}
    />
  );
}
