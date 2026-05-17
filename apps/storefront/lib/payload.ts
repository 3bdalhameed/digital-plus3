import { draftMode } from "next/headers";
import { PrismaClient, Prisma } from "@prisma/client";
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
    const errBody = await res.text().catch(() => "");
    console.error(`[payloadFetch] ${url} → ${res.status}`, errBody);
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
  q?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<PayloadDocs<Product>> {
  if (params?.category || params?.subcategory || params?.q) {
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
  q?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<PayloadDocs<Product>> {
  const page = params.page || 1;
  const limitNum = params.limit || 12;
  const offset = (page - 1) * limitNum;

  type ProductRow = {
    id: number;
    slug: string;
    name_ar: string;
    name_en: string | null;
    price: string;
    compare_price: string | null;
    currency: string;
    status: string;
    type: string;
    image_url: string | null;
    delivery_fields: any;
  };
  type CountRow = { count: bigint };

  const cat = params.category ?? null;
  const sub = params.subcategory ?? null;
  const q = params.q?.trim() || null;

  // Optional text-search fragment — appended to every WHERE clause when q is set.
  const qFilter = q
    ? Prisma.sql`AND (p.name_ar ILIKE ${`%${q}%`} OR p.name_en ILIKE ${`%${q}%`})`
    : Prisma.empty;

  // Common SELECT + LEFT JOIN for image — reused in all branches.
  const selectCols = Prisma.sql`
    SELECT p.id, p.slug, p.name_ar, p.name_en, p.price, p.compare_price, p.currency, p.status, p.type,
           m.url AS image_url, p.delivery_fields
    FROM products p
    LEFT JOIN products_rels pr_img ON pr_img.parent_id = p.id AND pr_img.path = 'images.0.image'
    LEFT JOIN media m ON m.id = pr_img.media_id`;

  let productRows: ProductRow[];
  let countRows: CountRow[];

  if (cat && sub) {
    [productRows, countRows] = await Promise.all([
      prisma.$queryRaw<ProductRow[]>(Prisma.sql`
        ${selectCols}
        JOIN products_rels pr_cat ON pr_cat.parent_id = p.id AND pr_cat.path = 'category'
        JOIN categories c ON c.id = pr_cat.categories_id
        JOIN products_rels pr_sub ON pr_sub.parent_id = p.id AND pr_sub.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr_sub.subcategories_id
        WHERE p.status = 'published' AND c.slug = ${cat} AND sc.slug = ${sub} ${qFilter}
        ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM products p
        JOIN products_rels pr_cat ON pr_cat.parent_id = p.id AND pr_cat.path = 'category'
        JOIN categories c ON c.id = pr_cat.categories_id
        JOIN products_rels pr_sub ON pr_sub.parent_id = p.id AND pr_sub.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr_sub.subcategories_id
        WHERE p.status = 'published' AND c.slug = ${cat} AND sc.slug = ${sub} ${qFilter}`),
    ]);
  } else if (cat) {
    [productRows, countRows] = await Promise.all([
      prisma.$queryRaw<ProductRow[]>(Prisma.sql`
        ${selectCols}
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'category'
        JOIN categories c ON c.id = pr.categories_id
        WHERE p.status = 'published' AND c.slug = ${cat} ${qFilter}
        ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM products p
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'category'
        JOIN categories c ON c.id = pr.categories_id
        WHERE p.status = 'published' AND c.slug = ${cat} ${qFilter}`),
    ]);
  } else if (sub) {
    [productRows, countRows] = await Promise.all([
      prisma.$queryRaw<ProductRow[]>(Prisma.sql`
        ${selectCols}
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr.subcategories_id
        WHERE p.status = 'published' AND sc.slug = ${sub} ${qFilter}
        ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM products p
        JOIN products_rels pr ON pr.parent_id = p.id AND pr.path = 'subcategory'
        JOIN subcategories sc ON sc.id = pr.subcategories_id
        WHERE p.status = 'published' AND sc.slug = ${sub} ${qFilter}`),
    ]);
  } else {
    // q-only search — no category/subcategory filter
    [productRows, countRows] = await Promise.all([
      prisma.$queryRaw<ProductRow[]>(Prisma.sql`
        ${selectCols}
        WHERE p.status = 'published' ${qFilter}
        ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`),
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM products p
        WHERE p.status = 'published' ${qFilter}`),
    ]);
  }

  const totalDocs = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.ceil(totalDocs / limitNum) || 0;

  const docs = productRows.map((row) => ({
    id: String(row.id),
    slug: row.slug,
    nameAr: row.name_ar,
    nameEn: row.name_en ?? undefined,
    name: { ar: row.name_ar, en: row.name_en ?? "" },
    price: parseFloat(row.price),
    comparePrice: row.compare_price ? parseFloat(row.compare_price) : undefined,
    currency: row.currency as Product["currency"],
    status: row.status as Product["status"],
    type: row.type as Product["type"],
    images: row.image_url ? [{ image: { url: row.image_url } }] : [],
    deliveryFields: Array.isArray(row.delivery_fields) ? row.delivery_fields : [],
  } as unknown as Product));

  return {
    docs,
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
  customer: string | number;
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
    headers: {
      "x-internal-secret": process.env.PAYLOAD_INTERNAL_SECRET || "",
    },
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
