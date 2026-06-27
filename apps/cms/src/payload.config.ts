import { buildConfig } from "payload/config";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import path from "path";
import dotenv from "dotenv";
import Dashboard from "./admin/components/Dashboard";
import ThemeProvider from "./admin/components/ThemeProvider";
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
import { Users } from "./collections/Users";

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
  ],

  collections: [
    Products,
    Categories,
    Subcategories,
    Posts,
    Orders,
    Customers,
    EvidenceLogs,
    SupportTickets,
    Media,
    Users,
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

  // Products
  await run("badge_col", "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge varchar DEFAULT 'none'");
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

  return results;
}
