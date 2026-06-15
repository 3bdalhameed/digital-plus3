import { draftMode } from "next/headers";
import { unstable_cache } from "next/cache";
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
const _dbUrl = process.env.CMS_DATABASE_URL || process.env.DATABASE_URL;
const prisma =
  globalForPrisma.__payloadPrisma ||
  new PrismaClient(
    _dbUrl ? { datasources: { db: { url: _dbUrl } } } : undefined
  );
if (process.env.NODE_ENV !== "production")
  globalForPrisma.__payloadPrisma = prisma;

// ---------------------
// Generic fetch helper
// ---------------------

/**
 * Flatten a nested `where` filter object into bracket-notation params.
 * Payload v2's REST API uses the `qs` parser, which understands
 * `where[slug][equals]=foo` but NOT a JSON-encoded `where=<json>`. Before
 * this helper, every slug lookup silently returned ALL docs and grabbed
 * docs[0] (so every product/category/post page showed the same record).
 */
function flattenWhere(obj: Record<string, any>, prefix = "where"): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = `${prefix}[${k}]`;
    if (typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenWhere(v, key));
    } else {
      out.push([key, String(v)]);
    }
  }
  return out;
}

async function payloadFetch<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const { params, ...fetchOptions } = options || {};
  const url = new URL(`${PAYLOAD_API_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (key === "where" && value) {
        let obj: Record<string, any> | null = null;
        if (typeof value === "string") {
          try { obj = JSON.parse(value); } catch { obj = null; }
        } else if (typeof value === "object") {
          obj = value as any;
        }
        if (obj && Object.keys(obj).length > 0) {
          for (const [bk, bv] of flattenWhere(obj)) {
            url.searchParams.append(bk, bv);
          }
          return;
        }
        // Empty {} -> no where filter, just skip.
        if (obj && Object.keys(obj).length === 0) return;
      }
      url.searchParams.set(key, value);
    });
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

const getProductsFilteredCached = unstable_cache(
  getProductsFiltered,
  ["products-filtered"],
  { revalidate: 60, tags: ["products"] }
);

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
    return getProductsFilteredCached(params);
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

  const decoded = slug.includes("%") ? safeDecode(slug) : slug;
  const params: Record<string, string> = {
    "where[slug][equals]": decoded,
    depth: "2",
    limit: "1",
  };
  if (!isPreview) params["where[status][equals]"] = "published";

  const data = await payloadFetch<PayloadDocs<Product>>("/products", {
    params,
    ...(isPreview ? { cache: "no-store" } : { next: { revalidate: 60 } }),
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
  let isPreview = false;
  try { isPreview = draftMode().isEnabled; } catch {}

  const decoded = slug.includes("%") ? safeDecode(slug) : slug;

  const data = await payloadFetch<PayloadDocs<Category>>("/categories", {
    params: {
      where: JSON.stringify({ slug: { equals: decoded } }),
      depth: "1",
      limit: "1",
    },
    ...(isPreview ? { cache: "no-store" } : { next: { revalidate: 60 } }),
  });
  return data.docs[0] || null;
}

// ---------------------
// Subcategories
// ---------------------

export async function getSubcategories(
  categorySlug?: string
): Promise<Subcategory[]> {
  let isPreview = false;
  try { isPreview = draftMode().isEnabled; } catch {}

  const data = await payloadFetch<PayloadDocs<Subcategory>>("/subcategories", {
    params: {
      // In preview show all subcategories regardless of isActive, so editors
      // can see drafts; in production stick to the active filter.
      where: JSON.stringify(isPreview ? {} : { isActive: { equals: true } }),
      sort: "position",
      depth: "1",
      limit: "500",
    },
    ...(isPreview ? { cache: "no-store" } : { next: { revalidate: 60 } }),
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
  let isPreview = false;
  try { isPreview = draftMode().isEnabled; } catch {}

  const decoded = slug.includes("%") ? safeDecode(slug) : slug;

  const data = await payloadFetch<PayloadDocs<Subcategory>>("/subcategories", {
    params: {
      where: JSON.stringify({ slug: { equals: decoded } }),
      depth: "1",
      limit: "1",
    },
    ...(isPreview ? { cache: "no-store" } : { next: { revalidate: 60 } }),
  });
  return data.docs[0] || null;
}

// ---------------------
// Blog posts
// ---------------------

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  bodyHtml: string;
  publishedAt?: string | null;
  author?: string | null;
  tags?: Array<{ tag: string }>;
  status?: "published" | "draft";
  updatedAt: string;
  createdAt: string;
}

export async function getPosts(params?: {
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
}): Promise<PayloadDocs<BlogPost>> {
  let isPreview = false;
  try { isPreview = draftMode().isEnabled; } catch {}

  const where: Record<string, any> = isPreview ? {} : { status: { equals: "published" } };
  if (params?.q) {
    where.title = { like: params.q };
  }
  if (params?.tag) {
    // Tags is an array of { tag: string }; Payload supports filtering nested fields.
    where["tags.tag"] = { equals: params.tag };
  }

  return payloadFetch<PayloadDocs<BlogPost>>("/posts", {
    params: {
      where: JSON.stringify(where),
      sort: "-publishedAt",
      depth: "0",
      limit: String(params?.limit ?? 12),
      page: String(params?.page ?? 1),
    },
    ...(isPreview ? { cache: "no-store" } : { next: { revalidate: 60 } }),
  });
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  let isPreview = false;
  try { isPreview = draftMode().isEnabled; } catch {}

  // Arabic / non-ASCII slugs arrive URL-encoded (`%D8%B7...`) from the
  // Next.js route param in some hosting setups (Coolify/Traefik don't
  // always decode the path before handing it off). Decode if needed so
  // the API query matches the raw value stored in Postgres.
  const decoded = slug.includes("%") ? safeDecode(slug) : slug;

  const data = await payloadFetch<PayloadDocs<BlogPost>>("/posts", {
    params: {
      where: JSON.stringify({ slug: { equals: decoded } }),
      depth: "0",
      limit: "1",
    },
    ...(isPreview ? { cache: "no-store" } : { next: { revalidate: 60 } }),
  });
  return data.docs[0] || null;
}

function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

// ---------------------
// Orders
// ---------------------

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const orderId = Number(id);
    if (!orderId) return null;

    type OrderRow = {
      id: number; order_number: string; status: string; total_amount: string;
      currency: string; digital_delivery_log: any; updated_at: Date; created_at: Date;
      item_pos: number | null; item_id: string | null; quantity: string | null;
      unit_price: string | null; total_price: string | null; delivery_info: any;
      product_id: number | null; name_ar: string | null; name_en: string | null;
      product_slug: string | null;
    };

    const rows = await prisma.$queryRaw<OrderRow[]>(Prisma.sql`
      SELECT
        o.id, o.order_number, o.status, o.total_amount, o.currency,
        o.digital_delivery_log, o.updated_at, o.created_at,
        oi._order AS item_pos, oi.id AS item_id, oi.quantity, oi.unit_price, oi.total_price, oi.delivery_info,
        p.id AS product_id, p.name_ar, p.name_en, p.slug AS product_slug
      FROM orders o
      LEFT JOIN orders_items oi ON oi._parent_id = o.id
      LEFT JOIN orders_rels orprod ON (
        orprod.parent_id = o.id
        AND orprod.path = ('items.' || (oi._order - 1)::text || '.product')
      )
      LEFT JOIN products p ON p.id = orprod.products_id
      WHERE o.id = ${orderId}
      ORDER BY oi._order
    `);

    if (!rows.length) return null;
    const first = rows[0];

    const items = rows
      .filter((r) => r.item_id != null)
      .map((r) => ({
        product: {
          id: String(r.product_id ?? ""),
          slug: r.product_slug ?? "",
          nameAr: r.name_ar ?? "",
          nameEn: r.name_en ?? undefined,
          name: { ar: r.name_ar ?? "", en: r.name_en ?? "" },
        },
        quantity: Number(r.quantity),
        unitPrice: parseFloat(r.unit_price ?? "0"),
        totalPrice: parseFloat(r.total_price ?? "0"),
        deliveryInfo: r.delivery_info,
      }));

    return {
      id: String(first.id),
      orderNumber: first.order_number,
      status: first.status as Order["status"],
      totalAmount: parseFloat(first.total_amount),
      currency: first.currency as Order["currency"],
      digitalDeliveryLog: first.digital_delivery_log,
      items,
      createdAt: first.created_at.toISOString(),
      updatedAt: first.updated_at.toISOString(),
    } as unknown as Order;
  } catch (e) {
    console.error("[getOrder]", e);
    return null;
  }
}

export async function getCustomerOrders(customerEmail: string): Promise<Order[]> {
  try {
    type OrderRow = {
      id: number; order_number: string; status: string;
      total_amount: string; currency: string; created_at: Date;
    };
    const rows = await prisma.$queryRaw<OrderRow[]>(Prisma.sql`
      SELECT o.id, o.order_number, o.status, o.total_amount, o.currency, o.created_at
      FROM orders o
      JOIN orders_rels r ON r.parent_id = o.id AND r.path = 'customer'
      JOIN customers c ON c.id = r.customers_id
      WHERE c.email = ${customerEmail}
      ORDER BY o.created_at DESC
      LIMIT 50
    `);

    return rows.map((r) => ({
      id: String(r.id),
      orderNumber: r.order_number,
      status: r.status as Order["status"],
      totalAmount: parseFloat(r.total_amount),
      currency: r.currency as Order["currency"],
      createdAt: r.created_at.toISOString(),
    } as unknown as Order));
  } catch (e) {
    console.error("[getCustomerOrders]", e);
    return [];
  }
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
  try {
    const orderIdNum = Number(orderId);
    if (!orderIdNum) return [];

    type EvidenceRow = {
      id: number; type: string; timestamp: Date;
      ip_address: string; user_agent: string | null;
      device: string | null; browser: string | null; data: any;
    };

    const rows = await prisma.$queryRaw<EvidenceRow[]>(Prisma.sql`
      SELECT el.id, el.type, el.timestamp, el.ip_address, el.user_agent, el.device, el.browser, el.data
      FROM evidence_logs el
      WHERE EXISTS (
        SELECT 1 FROM evidence_logs_rels er
        WHERE er.parent_id = el.id AND er.path = 'order' AND er.orders_id = ${orderIdNum}
      )
      ORDER BY el.timestamp ASC
      LIMIT 100
    `);

    return rows.map((r) => ({
      id: String(r.id),
      type: r.type,
      timestamp: r.timestamp?.toISOString(),
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      device: r.device,
      browser: r.browser,
      data: r.data,
    }));
  } catch (e) {
    console.error("[getOrderEvidence]", e);
    return [];
  }
}

// ---------------------
// Globals
// ---------------------

export async function getHomePage(): Promise<HomePage> {
  let isPreview = false;
  try { isPreview = draftMode().isEnabled; } catch {}
  return payloadFetch("/globals/home-page", {
    params: { depth: "2" },
    ...(isPreview ? { cache: "no-store" } : {}),
  });
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
