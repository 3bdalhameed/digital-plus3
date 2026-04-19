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
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(fetchOptions?.headers || {}),
    },
    next: { revalidate: 60 }, // ISR: revalidate every 60s
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
  subcategory?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<PayloadDocs<Product>> {
  const where: Record<string, any> = { status: { equals: "published" } };

  if (params?.category) where["category.slug"] = { equals: params.category };
  if (params?.subcategory) where["subcategory.slug"] = { equals: params.subcategory };
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

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const data = await payloadFetch<PayloadDocs<Product>>("/products", {
    params: {
      where: JSON.stringify({ slug: { equals: slug }, status: { equals: "published" } }),
      depth: "2",
      limit: "1",
    },
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
  categoryId?: string
): Promise<Subcategory[]> {
  const where: Record<string, any> = { isActive: { equals: true } };
  if (categoryId) where.category = { equals: categoryId };

  const data = await payloadFetch<PayloadDocs<Subcategory>>("/subcategories", {
    params: {
      where: JSON.stringify(where),
      sort: "position",
      depth: "1",
      limit: "100",
    },
  });
  return data.docs;
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
