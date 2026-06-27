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

// k6 runs setup() once on the test runner before VUs start. Anything we
// return here is passed into every VU iteration as the first argument.
export function setup() {
  return buildPool(BASE_URL);
}

export default function (pool) {
  // Pick one URL from each kind that has at least one entry. Skip the
  // ones with empty pools so the check doesn't 404 on a missing URL.
  const targets = [
    pick(pool.home),
    pick(pool.products),
    pick(pool.collections),
    pick(pool.posts),
  ].filter(Boolean);

  for (const path of targets) {
    // redirects: "follow" is the default, but we set explicitly so a
    // future k6 version that changes the default doesn't surprise us.
    const res = http.get(`${BASE_URL}${path}`, {
      tags: { name: pathKind(path) },
      redirects: 5,
    });
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
