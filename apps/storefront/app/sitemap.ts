import type { MetadataRoute } from "next";
import { getCategories, getPosts, getProducts, getSubcategories } from "@/lib/payload";

/**
 * Dynamic sitemap served at /sitemap.xml.
 *
 * Next.js App Router auto-serves this file. It re-renders whenever a
 * request hits /sitemap.xml — set `revalidate` to cache for an hour
 * so we're not hitting the CMS on every search-bot ping.
 *
 * Includes:
 *   - Static pages (home, about, products list, policies, auth)
 *   - Every published product       → /products/<slug>
 *   - Every active category         → /collections/<slug>
 *   - Every active subcategory      → /collections/<slug>
 *
 * Last-modified dates come from Payload's `updatedAt` field on each doc,
 * which makes Google re-crawl only what actually changed.
 */

export const revalidate = 3600; // 1 hour

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://digital-plus3.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                  lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/products`,          lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/blogs/news`,        lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${SITE_URL}/about`,             lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/policies/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/policies/terms`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/policies/refund`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/login`,             lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${SITE_URL}/register`,          lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  // ── Live content from Payload ─────────────────────────────
  // Failures here must NOT take down the whole sitemap — return what we have.
  const [categories, subcategories, productsPage1, postsPage1] = await Promise.all([
    getCategories().catch(() => []),
    getSubcategories().catch(() => []),
    getProducts({ limit: 1000 }).catch(() => ({ docs: [], totalPages: 0 } as any)),
    getPosts({ limit: 1000 }).catch(() => ({ docs: [], totalPages: 0 } as any)),
  ]);

  const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((cat: any) => ({
    url: `${SITE_URL}/collections/${cat.slug}`,
    lastModified: cat.updatedAt ? new Date(cat.updatedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const subcategoryUrls: MetadataRoute.Sitemap = (subcategories || [])
    .filter((sub: any) => sub.slug)
    .map((sub: any) => ({
      url: `${SITE_URL}/collections/${sub.slug}`,
      lastModified: sub.updatedAt ? new Date(sub.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // ── Fetch remaining product pages ─────────────────────────
  // The first call already gave us page 1 with limit 1000. For most stores
  // that's the whole catalog. If you have >1000 products, loop the rest.
  let allProducts = productsPage1.docs || [];
  if (productsPage1.totalPages > 1) {
    const morePages = await Promise.all(
      Array.from({ length: productsPage1.totalPages - 1 }, (_, i) =>
        getProducts({ limit: 1000, page: i + 2 }).catch(() => ({ docs: [] } as any))
      )
    );
    for (const p of morePages) {
      allProducts = allProducts.concat(p.docs || []);
    }
  }

  const productUrls: MetadataRoute.Sitemap = allProducts
    .filter((p: any) => p.slug && p.status === "published")
    .map((p: any) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // ── Blog posts ─────────────────────────────
  // Match the existing Shopify URL pattern exactly so the imported posts
  // keep the same indexed URLs after cutover — zero SEO bleed.
  let allPosts = postsPage1.docs || [];
  if (postsPage1.totalPages > 1) {
    const morePages = await Promise.all(
      Array.from({ length: postsPage1.totalPages - 1 }, (_, i) =>
        getPosts({ limit: 1000, page: i + 2 }).catch(() => ({ docs: [] } as any))
      )
    );
    for (const p of morePages) allPosts = allPosts.concat(p.docs || []);
  }
  const postUrls: MetadataRoute.Sitemap = allPosts
    .filter((p: any) => p.slug)
    .map((p: any) => ({
      url: `${SITE_URL}/blogs/news/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...categoryUrls, ...subcategoryUrls, ...productUrls, ...postUrls];
}
