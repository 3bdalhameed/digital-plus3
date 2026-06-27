// Ramping stress test — useful to find where p95 latency or error rate
// starts misbehaving. Goes from 0 to a peak VU count and back down.
//
// Run: k6 run tests/k6/stress.js
//      PEAK=200 k6 run tests/k6/stress.js
//      BASE_URL=https://digital-plus3.com k6 run tests/k6/stress.js

import http from "k6/http";
import { check, sleep } from "k6";
import { buildPool, pick } from "./_pool.js";

const BASE_URL = __ENV.BASE_URL || "https://stg.digital-plus3.com";
const PEAK = Number(__ENV.PEAK || 100);

export const options = {
  // Realistic ramping: 30s warmup → ramp to peak over 2 min → hold 2 min →
  // ramp back down. Adjust PEAK via env to push harder.
  stages: [
    { duration: "30s", target: Math.floor(PEAK * 0.2) },
    { duration: "2m",  target: PEAK },
    { duration: "2m",  target: PEAK },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // Relaxed compared to load.js — stress mode is about finding the
    // limit, not staying under one.
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"],
  },
};

export function setup() {
  return buildPool(BASE_URL);
}

export default function (pool) {
  const all = [
    ...pool.home.map((p) => ({ p, k: "home" })),
    ...pool.products.map((p) => ({ p, k: "product" })),
    ...pool.collections.map((p) => ({ p, k: "collection" })),
    ...pool.posts.map((p) => ({ p, k: "post" })),
  ];
  const choice = pick(all);
  if (!choice) return;
  const res = http.get(`${BASE_URL}${choice.p}`, { tags: { name: choice.k } });
  check(res, { "200": (r) => r.status === 200 });
  sleep(Math.random() * 2);
}
