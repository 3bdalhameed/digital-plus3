// URL pool builder shared between load + stress scripts.
//
// Fetches the live sitemap.xml once (during the init context so it runs
// only on the load generator, not per VU iteration) and groups the URLs
// by section. Falls back to a small hardcoded list if the sitemap fetch
// fails so the test can still run offline / with a misconfigured BASE_URL.

import http from "k6/http";

const FALLBACK = {
  products: ["forza-horizon-5", "best-pc-games-store", "chat-gpt-12"],
  collections: ["programs", "subscriptions"],
  posts: ["best-pc-games-store", "forza-horizon-5"],
};

export function buildPool(baseUrl) {
  const pool = {
    home: ["/", "/products", "/about", "/blogs/news"],
    products: FALLBACK.products.map((s) => `/products/${s}`),
    collections: FALLBACK.collections.map((s) => `/collections/${s}`),
    posts: FALLBACK.posts.map((s) => `/blogs/news/${s}`),
  };

  try {
    const res = http.get(`${baseUrl}/sitemap.xml`, { tags: { name: "sitemap" } });
    if (res.status !== 200) {
      console.log(`[pool] sitemap returned ${res.status}, using fallback`);
      return pool;
    }
    const xml = res.body || "";
    const locs = [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    const products = [];
    const collections = [];
    const posts = [];
    for (const loc of locs) {
      // k6's goja runtime doesn't expose a global URL constructor, so
      // parse the pathname out of the absolute URL manually.
      const match = loc.match(/^https?:\/\/[^/]+(\/[^?#]*)/);
      const p = match ? match[1] : loc;
      if (p.startsWith("/products/")) products.push(p);
      else if (p.startsWith("/collections/")) collections.push(p);
      else if (p.startsWith("/blogs/news/")) posts.push(p);
    }
    if (products.length) pool.products = products;
    if (collections.length) pool.collections = collections;
    if (posts.length) pool.posts = posts;

    console.log(
      `[pool] from sitemap: ${products.length} products, ` +
        `${collections.length} collections, ${posts.length} posts`
    );
  } catch (e) {
    console.log(`[pool] sitemap fetch threw, using fallback: ${e}`);
  }

  return pool;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
