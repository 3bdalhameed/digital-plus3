import { draftMode } from "next/headers";
import { PrismaClient } from "@prisma/client";
import type {
  Product,
  Category,
  Subcategory,
  Order,
  HomePage,
  SiteSettings,
  NavbarConfig,
  FooterConfig,
  PoliciesContent,
} from "@my-store/types";

const PAYLOAD_API_URL =
  process.env.PAYLOAD_API_URL || "http://localhost:3001/api";

// CMS_DATABASE_URL takes priority (Vercel: set this to the Neon URL).
// Falls back to DATABASE_URL so local dev keeps working without extra config.
const globalForPrisma = global as unknown as { __payloadPrisma: PrismaClient };
const prisma =
  globalForPrisma.__payloadPrisma ||
  new PrismaClient({
    datasources: {
      db: { url: process.env.CMS_DATABASE_URL || process.env.DATABASE_URL },
    },
  });
if (process.env.NODE_ENV !== "production")
  globalForPrisma.__payloadPrisma = prisma;

// ---------------------
// Generic fetch helper
// ---------------------

async function payloadFetch<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const { params, ...fetchOptions } = options || {};
  const url = new URL(`${PAYLOAD_API_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value)
    );
  }

  const res = await fetch(url.toString(), {
    ...(fetchOptions.cache ? {} : { next: { revalidate: 60 } }),
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(fetchOptions?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Payload API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ---------------------
// Products
// ---------------------

interface PayloadDocs<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export async function getProducts(params?: {
  category?: string;
  categoryId?: number;
  subcategory?: string;
  subcategoryId?: number;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<PayloadDocs<Product>> {
  // When filtering by category or subcategory, use direct DB query to get IDs
  // because Payload v2 REST API silently ignores WHERE on relationship/denormalized fields
  // until the CMS redeploys with the updated schema.
  if (params?.category || params?.subcategory) {
    return getProductsFiltered(params);
  }

  const where: Record<string, any> = { status: { equals: "published" } };
  if (params?.type) where.type = { equals: params.type };

  return payloadFetch("/products", {
    params: {
      where: JSON.stringify(where),
      depth: "2",
      page: String(params?.page || 1),
      limit: String(params?.limit || 12),
      sort: "-createdAt",
    },
  });
}

async function getProductsFiltered(params: {
  category?: string;
  subcategory?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<PayloadDocs<Product>> {
  const page = params.page || 1;
  const limitNum = params.limit || 12;
  const offset = (page - 1) * limitNum;

  type IdRow = { id: number | bigint };
  type CountRow = { count: bigint };

  const cat = params.category ?? null;
  const sub = params.subcategory ?? null;

  let idRows: IdRow[];
  let countRows: CountRow[];

  // Join against the products_rels + categories/subcategories tables so the
  // filter is always accurate regardless of whether the denormalized
  // category_slug/subcategory_slug columns are stale or missing.
  if (cat && sub) {
    [idRows, countRows] = await Promise.all([
      prisma.$queryRaw<IdRow[]>`
        SELECT p.id FROM products p
        JOIN products_rels pr_cat ON pr_cat.parent_id = p.id AND pr_cat.path = 'category'
        JOIN categories c ON c.id = pr_cat.categories_id
        JOIN products_rels pr_sub ON pr_sub.parent_id = p.id AND pr_sub.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr_sub.subcategories_id
        WHERE p.status = 'published'
          AND c.slug = ${cat}
          AND sc.slug = ${sub}
        ORDER BY p.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}`,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count FROM products p
        JOIN products_rels pr_cat ON pr_cat.parent_id = p.id AND pr_cat.path = 'category'
        JOIN categories c ON c.id = pr_cat.categories_id
        JOIN products_rels pr_sub ON pr_sub.parent_id = p.id AND pr_sub.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr_sub.subcategories_id
        WHERE p.status = 'published'
          AND c.slug = ${cat}
          AND sc.slug = ${sub}`,
    ]);
  } else if (cat) {
    [idRows, countRows] = await Promise.all([
      prisma.$queryRaw<IdRow[]>`
        SELECT p.id FROM products p
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'category'
        JOIN categories c ON c.id = pr.categories_id
        WHERE p.status = 'published'
          AND c.slug = ${cat}
        ORDER BY p.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}`,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count FROM products p
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'category'
        JOIN categories c ON c.id = pr.categories_id
        WHERE p.status = 'published'
          AND c.slug = ${cat}`,
    ]);
  } else {
    [idRows, countRows] = await Promise.all([
      prisma.$queryRaw<IdRow[]>`
        SELECT p.id FROM products p
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr.subcategories_id
        WHERE p.status = 'published'
          AND sc.slug = ${sub}
        ORDER BY p.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}`,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count FROM products p
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr.subcategories_id
        WHERE p.status = 'published'
          AND sc.slug = ${sub}`,
    ]);
  }

  const totalDocs = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.ceil(totalDocs / limitNum) || 0;

  if (idRows.length === 0) {
    return { docs: [], totalDocs, totalPages, page, hasNextPage: false, hasPrevPage: page > 1 };
  }

  // Fetch full product data from Payload using the filtered IDs
  const orWhere = idRows.map((r) => ({ id: { equals: String(Number(r.id)) } }));
  const data = await payloadFetch<PayloadDocs<Product>>("/products", {
    params: {
      where: JSON.stringify({ or: orWhere }),
      depth: "2",
      limit: String(idRows.length),
      sort: "-createdAt",
    },
  });

  return {
    ...data,
    totalDocs,
    totalPages,
    page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  let isPreview = false;
  try { isPreview = draftMode().isEnabled; } catch {}

  const params: Record<string, string> = {
    "where[slug][equals]": slug,
    depth: "2",
    limit: "1",
  };
  if (!isPreview) params["where[status][equals]"] = "published";

  const data = await payloadFetch<PayloadDocs<Product>>("/products", {
    params,
    cache: "no-store",
  });
  return data.docs[0] || null;
}

// ---------------------
// Categories
// ---------------------

export async function getCategories(): Promise<Category[]> {
  const data = await payloadFetch<PayloadDocs<Category>>("/categories", {
    params: {
      where: JSON.stringify({ isActive: { equals: true } }),
      sort: "position",
      depth: "1",
      limit: "100",
    },
  });
  return data.docs;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const data = await payloadFetch<PayloadDocs<Category>>("/categories", {
    params: {
      where: JSON.stringify({ slug: { equals: slug } }),
      depth: "1",
      limit: "1",
    },
  });
  return data.docs[0] || null;
}

// ---------------------
// Subcategories
// ---------------------

export async function getSubcategories(
  categorySlug?: string
): Promise<Subcategory[]> {
  const data = await payloadFetch<PayloadDocs<Subcategory>>("/subcategories", {
    params: {
      where: JSON.stringify({ isActive: { equals: true } }),
      sort: "position",
      depth: "1",
      limit: "500",
    },
  });

  if (!categorySlug) return data.docs;

  // Filter client-side since Payload v2 REST API doesn't reliably support
  // relationship field filtering by nested slug in JSON where format
  return data.docs.filter((sub: any) => {
    const cat = sub.category;
    if (!cat) return false;
    return typeof cat === "object" ? cat.slug === categorySlug : false;
  });
}

export async function getSubcategoryBySlug(slug: string): Promise<Subcategory | null> {
  const data = await payloadFetch<PayloadDocs<Subcategory>>("/subcategories", {
    params: {
      where: JSON.stringify({ slug: { equals: slug } }),
      depth: "0",
      limit: "1",
    },
  });
  return data.docs[0] || null;
}

// ---------------------
// Orders
// ---------------------

export async function getOrder(id: string): Promise<Order | null> {
  try {
    return await payloadFetch<Order>(`/orders/${id}`, { params: { depth: "2" } });
  } catch {
    return null;
  }
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const data = await payloadFetch<PayloadDocs<Order>>("/orders", {
    params: {
      where: JSON.stringify({ customer: { equals: customerId } }),
      sort: "-createdAt",
      depth: "2",
      limit: "50",
    },
  });
  return data.docs;
}

export async function createOrder(payload: {
  customer: string;
  items: {
    product: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  currency: string;
  termsAcceptedAt: string;
  termsAcceptedIP: string;
  termsAcceptedUserAgent: string;
}): Promise<Order> {
  return payloadFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------
// Evidence Logs
// ---------------------

export async function createEvidenceLog(data: {
  order?: string;
  customer: string;
  type: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  device?: string;
  browser?: string;
  sessionId?: string;
  data?: Record<string, any>;
}): Promise<any> {
  return payloadFetch("/evidence-logs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrderEvidence(orderId: string): Promise<any[]> {
  const data = await payloadFetch<PayloadDocs<any>>("/evidence-logs", {
    params: {
      where: JSON.stringify({ order: { equals: orderId } }),
      sort: "timestamp",
      depth: "1",
      limit: "100",
    },
  });
  return data.docs;
}

// ---------------------
// Globals
// ---------------------

export async function getHomePage(): Promise<HomePage> {
  return payloadFetch("/globals/home-page", { params: { depth: "2" } });
}

export async function getSettings(): Promise<SiteSettings> {
  return payloadFetch("/globals/settings", { params: { depth: "1" } });
}

export async function getNavbarConfig(): Promise<NavbarConfig> {
  return payloadFetch("/globals/navbar-config");
}

export async function getFooterConfig(): Promise<FooterConfig> {
  return payloadFetch("/globals/footer-config");
}

export async function getPolicies(): Promise<PoliciesContent> {
  return payloadFetch("/globals/policies-content");
}
