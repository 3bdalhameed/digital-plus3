# k6 load tests

Load tests for the digital-plus3 storefront. The scripts hit the live
sitemap once at init to discover real product / category / blog URLs,
then simulate a mix of common user actions (browsing the homepage,
opening product details, jumping to category collections, searching,
reading blog posts).

## Install k6

Pick whichever fits your setup:

- **Windows (winget)**: `winget install k6 --source winget`
- **Windows (chocolatey)**: `choco install k6`
- **macOS**: `brew install k6`
- **Docker**: `docker run --rm -i grafana/k6 run - <load.js`

Verify: `k6 version` should print e.g. `k6 v0.50.0`.

## Run the smoke test (sanity check)

Quick 30-second pass with 1 VU. Use this before any serious run to
confirm the URLs respond and the script parses correctly.

```bash
k6 run tests/k6/smoke.js
```

## Run the load test

Sustained mixed-scenario load against staging or prod.

```bash
# Default: 20 VUs for 2 min, hitting stg
k6 run tests/k6/load.js

# Custom load
k6 run --vus 50 --duration 5m tests/k6/load.js

# Hit production instead of staging
BASE_URL=https://digital-plus3.com k6 run tests/k6/load.js

# Save a JSON summary you can diff between runs
k6 run --summary-export=summary.json tests/k6/load.js
```

## Run the ramping stress test

Pushes VUs from 0 up to a peak then back down — useful for finding
where p95 latency starts climbing or error rates appear.

```bash
k6 run tests/k6/stress.js
```

## Interpreting results

The line you care most about is **`http_req_duration p(95)`** — the 95th
percentile response time. Anything above ~1s on cached pages is
worth investigating. The thresholds defined inside each script will
fail the run automatically if performance regresses past the budget,
so they can be wired into CI later without rewriting.

## URL pool

`load.js` and `stress.js` build their URL pool from
`https://stg.digital-plus3.com/sitemap.xml` at startup. If sitemap
parsing fails (DNS, 5xx, etc.), the scripts fall back to a small
hardcoded list so the test still runs.
