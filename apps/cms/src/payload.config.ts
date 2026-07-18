import { buildConfig } from "payload/config";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import path from "path";
import dotenv from "dotenv";
import Dashboard from "./admin/components/Dashboard";
import ThemeProvider from "./admin/components/ThemeProvider";
import ReviewsModerationView from "./admin/views/ReviewsModerationView";
import OttertagNav from "./admin/components/OttertagNav";

// Collections
import { Products } from "./collections/Products";
import { Categories } from "./collections/Categories";
import { Subcategories } from "./collections/Subcategories";
import { Orders } from "./collections/Orders";
import { Customers } from "./collections/Customers";
import { EvidenceLogs } from "./collections/EvidenceLogs";
import { SupportTickets } from "./collections/SupportTickets";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
// import { Reviews } from "./collections/Reviews"; // registration disabled -- see note below
import { Users } from "./collections/Users";
import { DiscountCodes } from "./collections/DiscountCodes";
import { MediaFolders } from "./collections/MediaFolders";

// Globals
import { HomePage } from "./globals/HomePage";
import { Settings } from "./globals/Settings";
import { NavbarConfig } from "./globals/NavbarConfig";
import { FooterConfig } from "./globals/FooterConfig";
import { PoliciesContent } from "./globals/PoliciesContent";

dotenv.config();

const plugins: any[] = [];

// Rebuild marker — bumped 2026-06-18 to force CMS image rebuild after CI
// silently failed to push a new image for the prior Latin numeral / Dashboard
// speed / Order summary cards commits. Bumped 2026-05-27 (run 2) after hardcoding
// PAYLOAD_PUBLIC_SERVER_URL in the workflow yaml. The first rebuild
// changed the bundle hash but still baked in the sslip.io URL because
// the CMS_URL GitHub secret hadn't been updated. Workflow now sets
// the URL inline so it can't drift.
export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001",

  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    css: path.resolve(__dirname, "admin/custom.css"),
    components: {
      providers: [ThemeProvider as any],
      Nav: OttertagNav as any,
      views: {
        Dashboard: Dashboard as any,
        // Custom top-level route for the review moderation queue.
        // Renders at /admin/reviews-moderation inside the Payload
        // panel; the sidebar link in OttertagNav points here.
        ReviewsModeration: {
          path: "/reviews-moderation",
          Component: ReviewsModerationView as any,
        } as any,
      },
    },
    meta: {
      titleSuffix: " — My Store",
      favicon: "/favicon.ico",
      ogImage: "/og-image.png",
    },
  },

  editor: lexicalEditor({}),

  // i18n — make Arabic the admin-UI default language. Payload v2
  // bundles ar.json translations out of the box (Save, Create New,
  // Filters, date-picker months, validation errors, toasts, etc.).
  // supportedLngs/resources default to all bundled translations,
  // so authenticated users with a stored preference can still
  // switch via their profile.
  i18n: {
    fallbackLng: "ar",
  },

  db: postgresAdapter({
    push: false,
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        "postgresql://postgres:postgres@localhost:5432/my_store",
    },
  }),

  plugins,

  // onInit runs once on every container start. We use it to apply our
  // idempotent DDL migrations BEFORE any HTTP request can hit the DB --
  // so deploys don't need an external curl to /api/migrate to keep
  // the schema in sync. Manual /api/migrate endpoint stays as a fallback
  // and a way to re-check status without restarting.
  onInit: async (payload: any) => {
    try {
      const results = await runMigrations(payload.db);
      payload.logger.info({ msg: "[migrate:onInit] complete", results });
    } catch (e: any) {
      payload.logger.error({ msg: "[migrate:onInit] failed", error: e?.message ?? String(e) });
    }
    // 7-day order maintenance: hourly sweep that auto-confirms paid
    // orders and auto-rates un-reviewed items with 5 stars once they
    // cross the 7-day mark. Idempotent -- safe to call any time.
    // Runs on startup and every hour after. In-process (single Coolify
    // container) is fine for our scale; if we ever scale out we'll
    // move this to a dedicated cron worker.
    const runMaint = async () => {
      try {
        const r = await runOrderMaintenance(payload.db);
        if (r.confirmed || r.autoReviews) {
          payload.logger.info({ msg: "[maint] 7-day sweep", ...r });
        }
      } catch (e: any) {
        payload.logger.error({ msg: "[maint] 7-day sweep failed", error: e?.message ?? String(e) });
      }
    };
    // Fire once shortly after boot (so ops can watch a fresh deploy
    // pick up any backlog), then every hour.
    setTimeout(runMaint, 30_000).unref?.();
    setInterval(runMaint, 60 * 60 * 1000).unref?.();

    // Keep-alive ping: a cheap SELECT 1 every 4 minutes so Neon
    // Free doesn't sleep its endpoint (idle threshold is 5 min).
    // First cold query after Neon sleeps costs ~1-2s while it
    // spins the compute back up -- exactly the "slow first load"
    // experience we're trying to kill. Interval is unref'd so it
    // doesn't block graceful shutdown, and the query is bounded so
    // a hung connection can't stall the loop.
    const keepAlive = async () => {
      const pool =
        payload.db?.pool ??
        payload.db?.drizzle?.session?.client ??
        payload.db?.client;
      if (!pool?.query) return;
      try {
        await pool.query("SELECT 1");
      } catch (e: any) {
        // Don't log every blip -- but do surface anything that
        // suggests the pool itself is unhealthy.
        payload.logger.warn({ msg: "[keep-alive] ping failed", error: e?.message });
      }
    };
    setInterval(keepAlive, 4 * 60 * 1000).unref?.();
  },

  endpoints: [
    {
      path: "/version",
      method: "get",
      handler: (_req, res) => {
        res.json({
          commit: process.env.COMMIT_SHA ?? "unknown",
          built:  process.env.COMMIT_SHA ? `https://github.com/3bdalhameed/digital-plus3/commit/${process.env.COMMIT_SHA}` : null,
        });
      },
    },
    {
      path: "/migrate",
      method: "get",
      handler: async (req, res) => {
        try {
          const results = await runMigrations(req.payload.db);
          res.json({ ok: true, results });
        } catch (e: any) {
          res.status(500).json({ error: e?.message ?? String(e) });
        }
      },
    },
    {
      path: "/preview-redirect",
      method: "get",
      handler: (req, res) => {
        const slug = req.query?.slug as string | undefined;
        const collection = (req.query?.collection as string | undefined) ?? "products";
        // Production fallback baked in so the preview keeps working
        // even if STOREFRONT_URL isn't set on the CMS container env.
        // (Common failure mode after Coolify redeploys.)
        const storefrontUrl =
          process.env.STOREFRONT_URL ||
          (process.env.NODE_ENV === "production"
            ? "https://digital-plus3.com"
            : "http://localhost:3000");
        const secret = process.env.PREVIEW_SECRET || "";

        if (!secret) {
          res
            .status(500)
            .send(
              "PREVIEW_SECRET is not set on the CMS container. Set it in Coolify env vars and make sure the storefront uses the same value."
            );
          return;
        }

        const target = `${storefrontUrl}/api/preview?secret=${encodeURIComponent(
          secret
        )}&collection=${encodeURIComponent(collection)}${
          slug ? `&slug=${encodeURIComponent(slug)}` : ""
        }`;
        res.redirect(target);
      },
    },

    /* ═════════════════════════════════════════════════════════════
       Review moderation queue.
       Payload can't own the reviews table as a proper collection
       (its Drizzle adapter chokes on the direct-FK schema shape),
       so the admin UI is a custom view + these raw endpoints.
       Both gated by an authenticated Payload user with an admin
       role (super_admin / admin / catalog).
    ═════════════════════════════════════════════════════════════ */
    {
      path: "/reviews-moderation",
      method: "get",
      handler: async (req, res) => {
        const role = (req.user as any)?.role as string | undefined;
        if (!role || !["super_admin", "admin", "catalog"].includes(role)) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }
        const db = req.payload.db as any;
        const pool = db?.pool ?? db?.drizzle?.session?.client ?? db?.client;
        if (!pool?.query) {
          res.status(500).json({ error: "DB pool unavailable" });
          return;
        }
        const raw = String((req.query as any)?.status ?? "pending").toLowerCase();
        const allowed = new Set(["pending", "approved", "rejected", "all"]);
        const status = allowed.has(raw) ? raw : "pending";
        try {
          const sql = status === "all"
            ? `SELECT r.id, r.product_id, r.order_id, r.rating, r.comment,
                      r.source, r.status, r.created_at,
                      p.name_ar AS product_name, p.slug AS product_slug,
                      c.email   AS customer_email, c.name AS customer_name
                 FROM reviews r
                 LEFT JOIN products  p ON p.id = r.product_id
                 LEFT JOIN customers c ON c.id = r.customer_id
                ORDER BY r.created_at DESC
                LIMIT 200`
            : `SELECT r.id, r.product_id, r.order_id, r.rating, r.comment,
                      r.source, r.status, r.created_at,
                      p.name_ar AS product_name, p.slug AS product_slug,
                      c.email   AS customer_email, c.name AS customer_name
                 FROM reviews r
                 LEFT JOIN products  p ON p.id = r.product_id
                 LEFT JOIN customers c ON c.id = r.customer_id
                WHERE r.status = $1
                ORDER BY r.created_at DESC
                LIMIT 200`;
          const params = status === "all" ? [] : [status];
          const { rows } = await pool.query(sql, params);
          res.json({ reviews: rows });
        } catch (e: any) {
          res.status(500).json({ error: e?.message ?? "Query failed" });
        }
      },
    },
    {
      path: "/reviews-moderation",
      method: "post",
      handler: async (req, res) => {
        const role = (req.user as any)?.role as string | undefined;
        if (!role || !["super_admin", "admin", "catalog"].includes(role)) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }
        const db = req.payload.db as any;
        const pool = db?.pool ?? db?.drizzle?.session?.client ?? db?.client;
        if (!pool?.query) {
          res.status(500).json({ error: "DB pool unavailable" });
          return;
        }
        const body = (req.body ?? {}) as { id?: unknown; status?: unknown };
        const id = Number(body.id);
        const nextStatus = String(body.status ?? "").toLowerCase();
        if (!Number.isFinite(id) || id <= 0) {
          res.status(400).json({ error: "Invalid id" });
          return;
        }
        if (!["approved", "rejected", "pending"].includes(nextStatus)) {
          res.status(400).json({ error: "Invalid status" });
          return;
        }
        try {
          await pool.query(
            "UPDATE reviews SET status = $1, updated_at = NOW() WHERE id = $2",
            [nextStatus, id],
          );
          res.json({ ok: true });
        } catch (e: any) {
          res.status(500).json({ error: e?.message ?? "Update failed" });
        }
      },
    },
  ],

  collections: [
    Products,
    Categories,
    Subcategories,
    Posts,
    Orders,
    Customers,
    // Reviews collection intentionally NOT registered here even though
    // the `reviews` table exists. Payload's Drizzle adapter expects
    // relationship fields (product / order / customer) to live in a
    // `reviews_rels` join table, but the sweep + storefront both use
    // direct FK columns for performance. The mismatch 500'd every
    // find on /api/reviews (which cascaded to /api/orders because
    // Drizzle builds the collective schema at boot). All read/write
    // paths for reviews are handled via raw SQL:
    //   - CMS 7-day sweep: runOrderMaintenance() below
    //   - Storefront: /api/reviews route + getOrderReviewsByProduct
    // Admin surface for reviews will come back with a
    // Payload-compatible schema (rels table + enum type) in a follow-up.
    EvidenceLogs,
    SupportTickets,
    Media,
    MediaFolders,
    Users,
    DiscountCodes,
  ],

  globals: [HomePage, Settings, NavbarConfig, FooterConfig, PoliciesContent],

  cors: [process.env.STOREFRONT_URL || "http://localhost:3000"],
  csrf: [process.env.STOREFRONT_URL || "http://localhost:3000"],

  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
});


// ── Shared migration runner ───────────────────────────────────────
// Called by both the onInit hook (runs on every container start) and
// the /api/migrate endpoint (manual re-run). All SQL is idempotent
// (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / etc.) so
// running this on every boot is safe and cheap.
async function runMigrations(db: any): Promise<Record<string, string>> {
  const pool = db.pool ?? db.drizzle?.session?.client ?? db.client;
  if (!pool?.query) {
    throw new Error("DB pool not found on payload.db");
  }
  const results: Record<string, string> = {};
  const run = async (label: string, sql: string) => {
    try { await pool.query(sql); results[label] = "ok"; }
    catch (e: any) { results[label] = e.message; }
  };

  // Orders: sequence powering the human-readable "Order-XXXXX" number.
  // START 1 so the first order becomes Order-00001. Padded to 5 digits by
  // the collection's beforeChange hook; it'll grow past 5 digits
  // naturally once we cross Order-99999, which is fine downstream.
  await run("order_number_seq", "CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1");
  // Orders: confirmedBy column so support can tell whether the customer
  // manually confirmed the order or the 7-day auto-sweep did. Nullable
  // while status is pending/paid; populated when status flips to
  // delivered. See collections/Orders.ts for the select field.
  await run(
    "orders_confirmed_by_col",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR"
  );

  // ── Email case-normalization (one-time; idempotent) ───────────────
  // Every write path in the storefront was inconsistent about the case
  // of session-sourced emails vs guest-OTP emails, so customers.email
  // and abandoned_carts.user_email can hold mixed-case rows today AND
  // lowercased duplicates from the recent checkout flow. Fix in three
  // steps:
  //   1. Merge case-different duplicate customers rows: repoint every
  //      rel from the mixed-case row to the lowercased one, then drop
  //      the mixed-case row.
  //   2. Lowercase whatever's left in customers.email.
  //   3. Lowercase abandoned_carts.user_email.
  // Each step guards on WHERE email <> lower(email) so re-runs are
  // no-ops. Safe to leave in runMigrations permanently.
  await run("customers_merge_case_dups", `
    WITH dups AS (
      SELECT lower(email) AS canonical,
             MIN(id)      AS keep_id,
             array_agg(id) AS all_ids
        FROM customers
       WHERE email <> lower(email)
          OR lower(email) IN (SELECT lower(email) FROM customers GROUP BY lower(email) HAVING count(*) > 1)
       GROUP BY lower(email)
      HAVING count(*) > 1
    ),
    repoint_orders AS (
      UPDATE orders_rels SET customers_id = d.keep_id
        FROM dups d
       WHERE orders_rels.customers_id = ANY(d.all_ids)
         AND orders_rels.customers_id <> d.keep_id
      RETURNING 1
    ),
    repoint_customers_rels AS (
      UPDATE customers_rels SET parent_id = d.keep_id
        FROM dups d
       WHERE customers_rels.parent_id = ANY(d.all_ids)
         AND customers_rels.parent_id <> d.keep_id
      RETURNING 1
    )
    DELETE FROM customers c
     USING dups d
     WHERE c.id = ANY(d.all_ids)
       AND c.id <> d.keep_id
  `);
  await run("customers_lowercase_email", `
    UPDATE customers
       SET email = lower(email)
     WHERE email <> lower(email)
  `);
  await run("abandoned_carts_lowercase_email", `
    UPDATE abandoned_carts
       SET user_email = lower(user_email)
     WHERE user_email <> lower(user_email)
  `);
  // Belt-and-suspenders: enforce the canonical form at the schema
  // level so future writes can't reintroduce case dups.
  await run(
    "customers_lower_email_unique_idx",
    "CREATE UNIQUE INDEX IF NOT EXISTS customers_lower_email_unique ON customers (lower(email))"
  );

  // Products
  await run("badge_col", "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge varchar DEFAULT 'none'");
  await run("in_stock_col", "ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true NOT NULL");
  // Featured Products block — title icon upload
  await run(
    "fp_title_icon",
    "ALTER TABLE home_page_blocks_featured_products ADD COLUMN IF NOT EXISTS title_icon_id integer REFERENCES media(id) ON DELETE SET NULL"
  );
  // Featured Products block — "show more" subcategory target
  await run(
    "fp_show_more_subcategory",
    "ALTER TABLE home_page_blocks_featured_products ADD COLUMN IF NOT EXISTS show_more_subcategory_id integer REFERENCES subcategories(id) ON DELETE SET NULL"
  );

  // Bilingual section titles — optional English variant on every homepage
  // block that has a `title` field. Storefront prefers title_en when the
  // visitor toggles the language switcher to EN. Payload maps `titleEn` →
  // column `title_en`. Idempotent; safe to re-run on every boot.
  for (const table of [
    "home_page_blocks_hero_banner",
    "home_page_blocks_featured_products",
    "home_page_blocks_category_grid",
    "home_page_blocks_category_banners",
    "home_page_blocks_category_row",
    "home_page_blocks_image_with_text",
    "home_page_blocks_feature_blocks",
    "home_page_blocks_stats_section",
    "home_page_blocks_testimonials",
    "home_page_blocks_faq_section",
    "home_page_blocks_newsletter",
  ]) {
    await run(
      `${table}_title_en`,
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS title_en VARCHAR`
    );
  }

  // Bilingual item-level fields on the four blocks whose ITEMS the
  // customer actually reads (feature cards, stats, testimonials, FAQ).
  // Table names follow Payload's array-subfield convention:
  //   home_page_blocks_<block_slug>_<array_field>
  // Column names are snake_case (regular text/textarea fields), just
  // like the existing item columns (name, text, question, answer).
  const itemEnCols: Array<[string, string]> = [
    // featureBlocks.items: title/description
    ["home_page_blocks_feature_blocks_items", "title_en VARCHAR"],
    ["home_page_blocks_feature_blocks_items", "description_en VARCHAR"],
    // statsSection.stats: label
    ["home_page_blocks_stats_section_stats", "label_en VARCHAR"],
    // testimonials.items: text
    ["home_page_blocks_testimonials_items", "text_en VARCHAR"],
    // faqSection.items: question + answer
    ["home_page_blocks_faq_section_items", "question_en VARCHAR"],
    ["home_page_blocks_faq_section_items", "answer_en VARCHAR"],
  ];
  for (const [table, colDef] of itemEnCols) {
    const colName = colDef.split(" ")[0];
    await run(
      `${table}_${colName}`,
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${colDef}`
    );
  }

  // Discount codes — new collection. push:false means Payload won't
  // create the table on its own; we mirror the field shape from
  // collections/DiscountCodes.ts here so the collection can be read
  // and written on first boot.
  //
  // IMPORTANT — Payload's Drizzle adapter issues INSERTs with quoted,
  // case-sensitive camelCase identifiers (e.g. `"discountType"`, not
  // `discount_type`). Older collections in this repo get away with
  // snake_case columns because their write paths only UPDATE changed
  // fields, but a fresh collection's CREATE INSERTs every field at
  // once, exposing the mismatch and 500ing the whole write. Every
  // column below matches the exact camelCase Payload uses, including
  // the enum type names.
  //
  // Also drop any leftover snake_case table + enums from the earlier
  // broken migrations so this re-runs cleanly on already-attempted
  // boxes. Safe: no successful writes ever landed (all previous POSTs
  // 500'd on the mismatch).
  await run("discount_codes_drop_legacy", `
    DROP TABLE IF EXISTS discount_codes_rels CASCADE;
    DROP TABLE IF EXISTS discount_codes CASCADE;
    DROP TYPE  IF EXISTS "enum_discount_codes_discount_type" CASCADE;
    DROP TYPE  IF EXISTS "enum_discount_codes_applies_to"    CASCADE;
    DROP TYPE  IF EXISTS "enum_discount_codes_discountType"  CASCADE;
    DROP TYPE  IF EXISTS "enum_discount_codes_appliesTo"     CASCADE;
  `);
  // Payload's Drizzle adapter here uses MIXED column naming:
  //   - enum-typed columns keep the JS field name literally → camelCase
  //     ("discountType", "appliesTo"), matching enum type name
  //     "enum_discount_codes_<field>"
  //   - every other column is converted to snake_case
  //     (discount_value, min_order_amount, current_uses, etc.)
  // This isn't a Payload option we can flip -- it's how the adapter's
  // schema builder happens to handle pgEnum vs regular column names.
  // Column list below is what the previous 500's tell us Drizzle is
  // actually querying for on INSERT.
  await run("discount_codes_enum_discountType", `
    DO $$ BEGIN
      CREATE TYPE "enum_discount_codes_discountType" AS ENUM ('percentage', 'fixed_amount');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await run("discount_codes_enum_appliesTo", `
    DO $$ BEGIN
      CREATE TYPE "enum_discount_codes_appliesTo" AS ENUM ('all', 'categories', 'products');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await run("discount_codes_table", `
    CREATE TABLE IF NOT EXISTS discount_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR NOT NULL UNIQUE,
      description VARCHAR,
      "discountType" "enum_discount_codes_discountType" NOT NULL DEFAULT 'percentage',
      discount_value NUMERIC NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      starts_at TIMESTAMP WITH TIME ZONE,
      expires_at TIMESTAMP WITH TIME ZONE,
      min_order_amount NUMERIC,
      max_uses INTEGER,
      current_uses INTEGER NOT NULL DEFAULT 0,
      max_uses_per_customer INTEGER,
      "appliesTo" "enum_discount_codes_appliesTo" NOT NULL DEFAULT 'all',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  await run(
    "discount_codes_code_upper_idx",
    "CREATE UNIQUE INDEX IF NOT EXISTS discount_codes_code_upper_idx ON discount_codes (upper(code))"
  );
  // Rels table for allowedCategories / allowedProducts hasMany fields.
  await run("discount_codes_rels_table", `
    CREATE TABLE IF NOT EXISTS discount_codes_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      categories_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      products_id INTEGER REFERENCES products(id) ON DELETE CASCADE
    )
  `);
  await run(
    "discount_codes_rels_parent_idx",
    "CREATE INDEX IF NOT EXISTS discount_codes_rels_parent_idx ON discount_codes_rels(parent_id)"
  );
  await run(
    "discount_codes_rels_path_idx",
    "CREATE INDEX IF NOT EXISTS discount_codes_rels_path_idx ON discount_codes_rels(path)"
  );

  // Orders: capture which discount code (if any) applied to an order and
  // the absolute amount subtracted. Kept as text + numeric rather than a
  // relationship so historical orders survive if the code is deleted.
  // snake_case for the same reason every other regular orders column
  // is snake_case -- these fields aren't enum-typed so Drizzle
  // converts the JS names (discountCode, discountAmount) to
  // discount_code, discount_amount at query time.
  //
  // Drop any camelCase-named columns from the previous broken
  // migration attempt before adding the correct snake_case version.
  await run(
    "orders_discountCode_drop_legacy",
    `ALTER TABLE orders DROP COLUMN IF EXISTS "discountCode"`
  );
  await run(
    "orders_discountAmount_drop_legacy",
    `ALTER TABLE orders DROP COLUMN IF EXISTS "discountAmount"`
  );
  await run(
    "orders_discount_code_col",
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR`
  );
  await run(
    "orders_discount_amount_col",
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC`
  );

  // Media folder taxonomy — new MediaFolders collection + a folder_id
  // relationship column on media. push:false so create the table +
  // column explicitly. Rels table isn't needed because folder is a
  // hasOne (single-target) relationship, not hasMany.
  await run("media_folders_table", `
    CREATE TABLE IF NOT EXISTS media_folders (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      description VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  // Media.folder is a single-target relationship, so Payload's Drizzle
  // stores the reference on the parent's own rels table rather than an
  // inline FK column. Ensure media_rels exists (it usually does thanks
  // to other upload/relationship fields, but this is idempotent) and
  // Payload will find + join the folder rows automatically.
  await run("media_rels_table", `
    CREATE TABLE IF NOT EXISTS media_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      "media-folders_id" INTEGER REFERENCES media_folders(id) ON DELETE SET NULL
    )
  `);
  await run(
    "media_rels_media_folders_col",
    `ALTER TABLE media_rels ADD COLUMN IF NOT EXISTS "media-folders_id" INTEGER REFERENCES media_folders(id) ON DELETE SET NULL`
  );
  await run(
    "media_rels_parent_idx",
    `CREATE INDEX IF NOT EXISTS media_rels_parent_idx ON media_rels(parent_id)`
  );
  await run(
    "media_rels_path_idx",
    `CREATE INDEX IF NOT EXISTS media_rels_path_idx ON media_rels(path)`
  );
  // Multi-image Banner block + its `slides` array. The slides sub-table
  // is what Payload's Drizzle adapter complains about with:
  //   Cannot read properties of undefined (reading
  //   'home_page_blocks_multi_image_banner_slides_pkey')
  await run("mib_block_table", `
    CREATE TABLE IF NOT EXISTS home_page_blocks_multi_image_banner (
      _order INTEGER NOT NULL,
      _parent_id INTEGER NOT NULL REFERENCES home_page(id) ON DELETE CASCADE,
      _path TEXT NOT NULL,
      id VARCHAR PRIMARY KEY,
      block_name VARCHAR,
      aspect_ratio VARCHAR,
      autoplay BOOLEAN,
      width VARCHAR,
      padding_y VARCHAR,
      enabled BOOLEAN
    )
  `);
  await run("mib_slides_table", `
    CREATE TABLE IF NOT EXISTS home_page_blocks_multi_image_banner_slides (
      _order INTEGER NOT NULL,
      _parent_id VARCHAR NOT NULL REFERENCES home_page_blocks_multi_image_banner(id) ON DELETE CASCADE,
      id VARCHAR PRIMARY KEY,
      image_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
      title VARCHAR,
      subtitle VARCHAR,
      cta_label VARCHAR,
      cta_link VARCHAR
    )
  `);
  await run(
    "mib_block_parent_idx",
    "CREATE INDEX IF NOT EXISTS home_page_blocks_multi_image_banner_parent_idx ON home_page_blocks_multi_image_banner (_parent_id)"
  );
  await run(
    "mib_slides_parent_idx",
    "CREATE INDEX IF NOT EXISTS home_page_blocks_multi_image_banner_slides_parent_idx ON home_page_blocks_multi_image_banner_slides (_parent_id)"
  );
  // Category Banners block — `enabled` field. Previously provided by the
  // shared layoutFields spread; when that spread was removed to declutter
  // the editor, the column stopped being written and existing rows read as
  // NULL, which the storefront treats as disabled. Add the column if
  // missing and backfill any NULLs to true so the section reappears.
  await run(
    "cb_enabled_col",
    "ALTER TABLE home_page_blocks_category_banners ADD COLUMN IF NOT EXISTS enabled BOOLEAN"
  );
  await run(
    "cb_enabled_backfill",
    "UPDATE home_page_blocks_category_banners SET enabled = TRUE WHERE enabled IS NULL"
  );
  // Footer global — new text fields (everything CMS-editable in the footer)
  for (const col of [
    "brand_description TEXT",
    "important_links_title VARCHAR",
    "contact_title VARCHAR",
    "phone VARCHAR",
    "email VARCHAR",
    "contact_form_url VARCHAR",
    "payment_title VARCHAR",
    "copyright_text VARCHAR",
  ]) {
    const [name] = col.split(" ");
    await run(`footer_${name}`, `ALTER TABLE footer_config ADD COLUMN IF NOT EXISTS ${col}`);
  }
  // Footer global — importantLinks array
  await run("footer_important_links_table", `
    CREATE TABLE IF NOT EXISTS footer_config_important_links (
      _order INTEGER NOT NULL,
      _parent_id INTEGER NOT NULL REFERENCES footer_config(id) ON DELETE CASCADE,
      id VARCHAR PRIMARY KEY,
      label VARCHAR,
      href VARCHAR
    )
  `);
  await run(
    "footer_important_links_parent_idx",
    "CREATE INDEX IF NOT EXISTS footer_config_important_links_parent_idx ON footer_config_important_links (_parent_id)"
  );
  // Footer global — policyLinks array
  await run("footer_policy_links_table", `
    CREATE TABLE IF NOT EXISTS footer_config_policy_links (
      _order INTEGER NOT NULL,
      _parent_id INTEGER NOT NULL REFERENCES footer_config(id) ON DELETE CASCADE,
      id VARCHAR PRIMARY KEY,
      label VARCHAR,
      href VARCHAR
    )
  `);
  await run(
    "footer_policy_links_parent_idx",
    "CREATE INDEX IF NOT EXISTS footer_config_policy_links_parent_idx ON footer_config_policy_links (_parent_id)"
  );
  // Footer global — paymentMethods array
  await run("footer_payment_methods_table", `
    CREATE TABLE IF NOT EXISTS footer_config_payment_methods (
      _order INTEGER NOT NULL,
      _parent_id INTEGER NOT NULL REFERENCES footer_config(id) ON DELETE CASCADE,
      id VARCHAR PRIMARY KEY,
      name VARCHAR,
      color VARCHAR,
      image_id INTEGER REFERENCES media(id) ON DELETE SET NULL
    )
  `);
  await run(
    "footer_payment_methods_image_col",
    "ALTER TABLE footer_config_payment_methods ADD COLUMN IF NOT EXISTS image_id INTEGER REFERENCES media(id) ON DELETE SET NULL"
  );
  await run(
    "footer_payment_methods_parent_idx",
    "CREATE INDEX IF NOT EXISTS footer_config_payment_methods_parent_idx ON footer_config_payment_methods (_parent_id)"
  );
  // Footer global needs a `_rels` join table because paymentMethods.image is
  // an upload (relationship). Drizzle's adapter LEFT JOINs this table on
  // every find of the global -- without it, every read returns
  //   ERROR: relation "footer_config_rels" does not exist
  // which cascades and breaks ANY page that reads the footer (incl. the
  // home page edit screen since it composites the footer global).
  await run("footer_config_rels_table", `
    CREATE TABLE IF NOT EXISTS footer_config_rels (
      id SERIAL PRIMARY KEY,
      "order" INTEGER,
      parent_id INTEGER NOT NULL REFERENCES footer_config(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      media_id INTEGER REFERENCES media(id) ON DELETE CASCADE
    )
  `);
  await run(
    "footer_config_rels_parent_idx",
    "CREATE INDEX IF NOT EXISTS footer_config_rels_parent_idx ON footer_config_rels(parent_id)"
  );
  await run(
    "footer_config_rels_path_idx",
    "CREATE INDEX IF NOT EXISTS footer_config_rels_path_idx ON footer_config_rels(path)"
  );
  await run(
    "footer_config_rels_media_id_idx",
    "CREATE INDEX IF NOT EXISTS footer_config_rels_media_id_idx ON footer_config_rels(media_id)"
  );
  // Footer global — English variants for every editable text field.
  // Match snake_case naming per the Drizzle convention we discovered
  // for regular (non-enum) text columns.
  for (const col of [
    "brand_description_en TEXT",
    "important_links_title_en VARCHAR",
    "contact_title_en VARCHAR",
    "payment_title_en VARCHAR",
    "copyright_text_en VARCHAR",
  ]) {
    const [name] = col.split(" ");
    await run(`footer_${name}`, `ALTER TABLE footer_config ADD COLUMN IF NOT EXISTS ${col}`);
  }
  // Link labelEn on both importantLinks and policyLinks item tables.
  await run(
    "footer_important_links_label_en",
    "ALTER TABLE footer_config_important_links ADD COLUMN IF NOT EXISTS label_en VARCHAR"
  );
  await run(
    "footer_policy_links_label_en",
    "ALTER TABLE footer_config_policy_links ADD COLUMN IF NOT EXISTS label_en VARCHAR"
  );
  // Category Banners block — cardWidth enum needs xs + xl added; the enum
  // was created earlier with only sm/md/lg, but the CMS field offers all 5.
  // ALTER TYPE ADD VALUE IF NOT EXISTS is idempotent and safe.
  await run(
    "cb_card_width_xs",
    `ALTER TYPE enum_home_page_blocks_category_banners_card_width ADD VALUE IF NOT EXISTS 'xs'`
  );
  await run(
    "cb_card_width_xl",
    `ALTER TYPE enum_home_page_blocks_category_banners_card_width ADD VALUE IF NOT EXISTS 'xl'`
  );
  // Posts (blog)
  await run("posts_table", `
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR NOT NULL,
      slug VARCHAR NOT NULL UNIQUE,
      excerpt VARCHAR,
      featured_image_url VARCHAR,
      body_html VARCHAR NOT NULL,
      published_at TIMESTAMP(3) WITH TIME ZONE,
      author VARCHAR,
      status VARCHAR DEFAULT 'published',
      source_url VARCHAR,
      updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now() NOT NULL,
      created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now() NOT NULL
    )
  `);
  await run("posts_tags_table", `
    CREATE TABLE IF NOT EXISTS posts_tags (
      _order INTEGER NOT NULL,
      _parent_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      id VARCHAR PRIMARY KEY,
      tag VARCHAR
    )
  `);
  await run("posts_slug_idx", "CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug)");
  await run("posts_published_idx", "CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published_at DESC NULLS LAST)");
  await run("posts_tags_parent_idx", "CREATE INDEX IF NOT EXISTS posts_tags_parent_idx ON posts_tags (_parent_id)");
  // Settings — drop orphan tables if they exist from old array fields
  await run("drop_social_links", "DROP TABLE IF EXISTS settings_social_links CASCADE");
  await run("drop_notif_emails", "DROP TABLE IF EXISTS settings_order_notification_emails CASCADE");
  // Settings — add new flat social columns
  const socialCols = [
    "instagram_url", "twitter_url", "facebook_url", "tiktok_url",
    "youtube_url", "telegram_url", "whatsapp_url", "order_notification_emails",
  ];
  for (const col of socialCols) {
    await run(`settings_${col}`, `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ${col} varchar`);
  }

  // Reviews — table + FK indexes + partial unique key so a given
  // (order, product, customer) triple can only be reviewed once.
  await run("reviews_table", `
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      comment TEXT,
      source VARCHAR NOT NULL DEFAULT 'customer',
      updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now() NOT NULL,
      created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT now() NOT NULL
    )
  `);
  await run("reviews_product_idx", "CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews(product_id)");
  await run("reviews_order_idx",   "CREATE INDEX IF NOT EXISTS reviews_order_idx   ON reviews(order_id)");
  await run("reviews_customer_idx","CREATE INDEX IF NOT EXISTS reviews_customer_idx ON reviews(customer_id)");
  await run(
    "reviews_unique",
    "CREATE UNIQUE INDEX IF NOT EXISTS reviews_unique_order_product_customer ON reviews(order_id, product_id, customer_id)"
  );
  // Moderation flow: new reviews land as 'pending' and only render on
  // the product page once an admin flips them to 'approved'. Existing
  // rows are backfilled as approved so we don't retroactively hide
  // reviews visible before the flag existed. Auto-sweep-generated
  // reviews (source='auto') skip moderation because they're implicit
  // 5-star ratings from the 7-day delivery sweep, not user comments.
  await run(
    "reviews_status_col",
    "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'pending'"
  );
  await run(
    "reviews_status_backfill",
    "UPDATE reviews SET status = 'approved' WHERE status = 'pending' AND (created_at < NOW() - INTERVAL '1 day' OR source = 'auto')"
  );
  await run(
    "reviews_status_idx",
    "CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status)"
  );

  return results;
}

/**
 * 7-day order maintenance.
 *
 * Two sweeps, both idempotent so the hourly cron never double-charges
 * anyone or creates duplicate reviews:
 *
 *   1. auto-confirm:  status='paid' AND created_at older than 7 days
 *                     → status='delivered'
 *   2. auto-rate:     for every line item in a delivered order that's
 *                     also older than 7 days, insert a 5-star review
 *                     with source='auto' — but only if the customer
 *                     hasn't already left one (the unique index
 *                     enforces this, we also filter with NOT EXISTS
 *                     so we skip the failed-insert cost).
 */
async function runOrderMaintenance(db: any): Promise<{ confirmed: number; autoReviews: number }> {
  const pool = db.pool ?? db.drizzle?.session?.client ?? db.client;
  if (!pool?.query) throw new Error("DB pool not found on payload.db");

  const confirmRes = await pool.query(`
    UPDATE orders
       SET status = 'delivered',
           confirmed_by = 'auto',
           updated_at = NOW()
     WHERE status = 'paid'
       AND created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  `);
  const confirmed = confirmRes.rowCount ?? 0;

  const reviewRes = await pool.query(`
    INSERT INTO reviews (product_id, order_id, customer_id, rating, source, status, created_at, updated_at)
    SELECT DISTINCT oi.product_id, o.id, o.customer_id, 5, 'auto', 'approved', NOW(), NOW()
      FROM orders o
      JOIN orders_items oi ON oi._parent_id = o.id
     WHERE o.status = 'delivered'
       AND o.created_at < NOW() - INTERVAL '7 days'
       AND o.customer_id IS NOT NULL
       AND oi.product_id IS NOT NULL
       AND NOT EXISTS (
             SELECT 1 FROM reviews r
              WHERE r.order_id = o.id
                AND r.product_id = oi.product_id
                AND r.customer_id = o.customer_id
           )
    ON CONFLICT (order_id, product_id, customer_id) DO NOTHING
  `);
  const autoReviews = reviewRes.rowCount ?? 0;

  return { confirmed, autoReviews };
}
