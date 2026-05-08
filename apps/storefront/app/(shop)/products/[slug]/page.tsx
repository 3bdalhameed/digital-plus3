import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/payload";
import { ProductDetailClient } from "./ProductDetailClient";

export const dynamic = "force-dynamic";

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

  return <ProductDetailClient product={product} productName={productName(product)} />;
}
