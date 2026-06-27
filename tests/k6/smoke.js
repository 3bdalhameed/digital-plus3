// Smoke test: 1 VU for 30s. Confirms every URL pool kind responds
// with 200 and the script as a whole parses + executes.
//
// Run: k6 run tests/k6/smoke.js
//      BASE_URL=https://digital-plus3.com k6 run tests/k6/smoke.js

import http from "k6/http";
import { check, sleep } from "k6";
import { buildPool, pick } from "./_pool.js";

const BASE_URL = __ENV.BASE_URL || "https://stg.digital-plus3.com";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],         // <5% errors
    http_req_duration: ["p(95)<3000"],      // p95 under 3s (smoke == soft)
  },
};

const POOL = buildPool(BASE_URL);

export default function () {
  const targets = [
    pick(POOL.home),
    pick(POOL.products),
    pick(POOL.collections),
    pick(POOL.posts),
  ];

  for (const path of targets) {
    const res = http.get(`${BASE_URL}${path}`, { tags: { name: pathKind(path) } });
    check(res, {
      [`${path} returned 200`]: (r) => r.status === 200,
    });
    sleep(1);
  }
}

function pathKind(p) {
  if (p.startsWith("/products/")) return "product";
  if (p.startsWith("/collections/")) return "collection";
  if (p.startsWith("/blogs/news/")) return "post";
  return "home";
}
