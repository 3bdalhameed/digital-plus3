import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/payload";
import { ProductDetailClient } from "./ProductDetailClient";
import { RelatedProducts } from "./RelatedProducts";

// Product detail — 5 min ISR. Stock/price change less than once a
// minute; admin toggles surface on the next revalidate window.
export const revalidate = 300;

function productName(product: any): string {
  return product.nameAr ?? product.name?.ar ?? product.nameEn ?? product.name?.en ?? "";
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return { title: "منتج غير موجود" };
  const name = productName(product);
  return {
    title: name,
    description: product.seoDescription || name,
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) notFound();

  // Fetch related products in the background. If it fails (network / new DB
  // shape / whatever), just render an empty row -- never block the main page.
  const related = await getRelatedProducts(product, 12).catch(() => []);

  return (
    <>
      <ProductDetailClient product={product} productName={productName(product)} />
      <RelatedProducts products={related} />
    </>
  );
}
