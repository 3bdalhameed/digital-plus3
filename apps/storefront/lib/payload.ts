/**
 * Payload CMS API client
 * All data fetching from the CMS goes through this module
 */

const PAYLOAD_URL = process.env.PAYLOAD_API_URL || 'http://localhost:3001'

interface FetchOptions {
  cache?: RequestCache
  revalidate?: number
  tags?: string[]
}

async function payloadFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { cache = 'force-cache', revalidate, tags } = options

  const res = await fetch(`${PAYLOAD_URL}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: revalidate !== undefined ? 'no-store' : cache,
    next: {
      revalidate,
      tags,
    },
  })

  if (!res.ok) {
    throw new Error(`Payload API error: ${res.status} ${res.statusText} for ${path}`)
  }

  return res.json()
}

// ─── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(params?: {
  page?: number
  limit?: number
  category?: string
  subcategory?: string
  status?: string
}) {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.limit) search.set('limit', String(params.limit || 12))
  search.set('where[status][equals]', params?.status || 'published')
  if (params?.category) search.set('where[category.slug][equals]', params.category)
  if (params?.subcategory) search.set('where[subcategory.slug][equals]', params.subcategory)
  search.set('depth', '2')

  return payloadFetch(`/products?${search}`, {
    tags: ['products'],
    revalidate: 60,
  })
}

export async function getProductBySlug(slug: string) {
  const data = await payloadFetch<{ docs: any[] }>(
    `/products?where[slug][equals]=${slug}&depth=3&limit=1`,
    { tags: [`product-${slug}`], revalidate: 60 },
  )
  return data.docs[0] || null
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return payloadFetch<{ docs: any[] }>(
    '/categories?where[isActive][equals]=true&sort=position&depth=1&limit=100',
    { tags: ['categories'], revalidate: 300 },
  )
}

export async function getCategoryBySlug(slug: string) {
  const data = await payloadFetch<{ docs: any[] }>(
    `/categories?where[slug][equals]=${slug}&depth=2&limit=1`,
    { tags: [`category-${slug}`], revalidate: 300 },
  )
  return data.docs[0] || null
}

export async function getSubcategoriesByCategory(categoryId: string) {
  return payloadFetch<{ docs: any[] }>(
    `/subcategories?where[category][equals]=${categoryId}&where[isActive][equals]=true&sort=position&limit=50`,
    { tags: [`subcategories-${categoryId}`], revalidate: 300 },
  )
}

// ─── Globals ──────────────────────────────────────────────────────────────────

export async function getHomePage() {
  return payloadFetch('/globals/home-page?depth=3', {
    tags: ['home-page'],
    revalidate: 60,
  })
}

export async function getSettings() {
  return payloadFetch('/globals/settings?depth=1', {
    tags: ['settings'],
    revalidate: 3600,
  })
}

export async function getNavbarConfig() {
  return payloadFetch('/globals/navbar-config?depth=2', {
    tags: ['navbar'],
    revalidate: 3600,
  })
}

export async function getFooterConfig() {
  return payloadFetch('/globals/footer-config?depth=1', {
    tags: ['footer'],
    revalidate: 3600,
  })
}

export async function getPoliciesContent() {
  return payloadFetch('/globals/policies-content', {
    tags: ['policies'],
    revalidate: 3600,
  })
}

// ─── Orders (authenticated) ────────────────────────────────────────────────────

export async function getOrderById(orderId: string, token: string) {
  return payloadFetch(`/orders/${orderId}?depth=3`, {
    cache: 'no-store',
  })
}

export async function getOrdersByCustomer(customerId: string) {
  return payloadFetch<{ docs: any[] }>(
    `/orders?where[customer][equals]=${customerId}&sort=-createdAt&depth=2`,
    { cache: 'no-store' },
  )
}

// ─── Internal (server-to-server with secret) ──────────────────────────────────

export async function payloadInternalPost(path: string, body: object) {
  const res = await fetch(`${PAYLOAD_URL}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `users API-Key ${process.env.PAYLOAD_SECRET_KEY}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Payload POST error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function payloadInternalPatch(path: string, body: object) {
  const res = await fetch(`${PAYLOAD_URL}/api${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `users API-Key ${process.env.PAYLOAD_SECRET_KEY}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Payload PATCH error ${res.status}: ${text}`)
  }

  return res.json()
}
