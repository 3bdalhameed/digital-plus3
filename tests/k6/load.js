// Mixed-scenario load test against the storefront.
//
// Simulates a typical visitor session: lands on the homepage, browses a
// collection, opens a product, occasionally searches, occasionally reads
// a blog post. Mix is weighted to look like a real visitor pattern
// rather than uniform — homepages get more traffic than blog posts.
//
// Run: k6 run tests/k6/load.js
//      k6 run --vus 50 --duration 5m tests/k6/load.js
//      BASE_URL=https://digital-plus3.com k6 run tests/k6/load.js

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { buildPool, pick } from "./_pool.js";

const BASE_URL = __ENV.BASE_URL || "https://stg.digital-plus3.com";

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || "2m",
  thresholds: {
    // Overall: less than 1% errors
    http_req_failed: ["rate<0.01"],
    // Whole-session p95 budget
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    // Per-page-kind budgets so a slow product page doesn't get masked
    // by lots of fast homepage hits.
    "http_req_duration{name:home}":       ["p(95)<1500"],
    "http_req_duration{name:product}":    ["p(95)<2000"],
    "http_req_duration{name:collection}": ["p(95)<2000"],
    "http_req_duration{name:post}":       ["p(95)<2500"],
    "http_req_duration{name:search}":     ["p(95)<2500"],
  },
};

const sessionDuration = new Trend("session_duration", true);

const SEARCH_TERMS = [
  "chatgpt", "canva", "adobe", "office", "windows", "freepik",
  "discord", "xbox", "steam", "youtube",
];

export function setup() {
  return buildPool(BASE_URL);
}

export default function (pool) {
  const start = Date.now();

  // 1. Land on the homepage (every session starts here).
  group("home", () => {
    const res = http.get(`${BASE_URL}/`, { tags: { name: "home" } });
    check(res, { "home 200": (r) => r.status === 200 });
  });
  sleep(rand(1, 3));

  // 2. Browse a category or search (50/50). Then click a product from it.
  if (Math.random() < 0.5 && pool.collections.length > 0) {
    group("collection", () => {
      const res = http.get(`${BASE_URL}${pick(pool.collections)}`, {
        tags: { name: "collection" },
      });
      check(res, { "collection 200": (r) => r.status === 200 });
    });
  } else {
    group("search", () => {
      const q = pick(SEARCH_TERMS);
      const res = http.get(`${BASE_URL}/products?q=${encodeURIComponent(q)}`, {
        tags: { name: "search" },
      });
      check(res, { "search 200": (r) => r.status === 200 });
    });
  }
  sleep(rand(2, 5));

  // 3. Open one product detail.
  if (pool.products.length > 0) {
    group("product", () => {
      const res = http.get(`${BASE_URL}${pick(pool.products)}`, {
        tags: { name: "product" },
      });
      check(res, { "product 200": (r) => r.status === 200 });
    });
    sleep(rand(2, 6));
  }

  // 4. 30% of visitors also read a blog post before leaving.
  if (Math.random() < 0.3 && pool.posts.length > 0) {
    group("post", () => {
      const res = http.get(`${BASE_URL}${pick(pool.posts)}`, {
        tags: { name: "post" },
      });
      check(res, { "post 200": (r) => r.status === 200 });
    });
    sleep(rand(1, 4));
  }

  sessionDuration.add(Date.now() - start);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
