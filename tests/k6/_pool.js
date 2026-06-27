// URL pool builder. Designed to be called from a k6 `setup()` function,
// which is the only place k6 allows http.get() outside the VU loop.
// init-context (module top-level) HTTP requests are forbidden by goja.

import http from "k6/http";

const FALLBACK = {
  home: ["/", "/products", "/about", "/blogs/news"],
  products: ["/products/chat-gpt-12", "/products/forza-horizon-5"],
  collections: [],
  posts: ["/blogs/news/best-pc-games-store", "/blogs/news/forza-horizon-5"],
};

/**
 * Fetch the live sitemap.xml and group its URLs into products /
 * collections / posts. Called from setup() — k6 invokes setup once on the
 * load generator before fanning out to VUs, then passes the returned
 * value into every VU iteration as the first argument.
 */
export function buildPool(baseUrl) {
  const pool = JSON.parse(JSON.stringify(FALLBACK));

  const res = http.get(`${baseUrl}/sitemap.xml`, {
    tags: { name: "sitemap" },
    timeout: "30s",
  });
  if (res.status !== 200) {
    console.log(`[pool] sitemap returned ${res.status}, using fallback`);
    return pool;
  }

  const xml = String(res.body || "");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const products = [];
  const collections = [];
  const posts = [];
  for (const loc of locs) {
    // k6's goja runtime doesn't expose WHATWG URL; parse pathname with
    // a regex instead.
    const match = loc.match(/^https?:\/\/[^/]+(\/[^?#]*)/);
    const p = match ? match[1] : loc;
    if (p.startsWith("/products/")) products.push(p);
    else if (p.startsWith("/collections/")) collections.push(p);
    else if (p.startsWith("/blogs/news/")) posts.push(p);
  }
  if (products.length)    pool.products = products;
  if (collections.length) pool.collections = collections;
  if (posts.length)       pool.posts = posts;

  console.log(
    `[pool] sitemap parsed: ${products.length} products, ` +
      `${collections.length} collections, ${posts.length} posts`
  );
  return pool;
}

export function pick(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
