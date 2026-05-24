import { buildConfig } from "payload/config";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import path from "path";
import dotenv from "dotenv";
import Dashboard from "./admin/components/Dashboard";
import ThemeProvider from "./admin/components/ThemeProvider";

// Collections
import { Products } from "./collections/Products";
import { Categories } from "./collections/Categories";
import { Subcategories } from "./collections/Subcategories";
import { Orders } from "./collections/Orders";
import { Customers } from "./collections/Customers";
import { EvidenceLogs } from "./collections/EvidenceLogs";
import { SupportTickets } from "./collections/SupportTickets";
import { Media } from "./collections/Media";
import { Users } from "./collections/Users";

// Globals
import { HomePage } from "./globals/HomePage";
import { Settings } from "./globals/Settings";
import { NavbarConfig } from "./globals/NavbarConfig";
import { FooterConfig } from "./globals/FooterConfig";
import { PoliciesContent } from "./globals/PoliciesContent";

dotenv.config();

const plugins: any[] = [];

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001",

  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    css: path.resolve(__dirname, "admin/custom.css"),
    components: {
      providers: [ThemeProvider as any],
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

  db: postgresAdapter({
    push: true,
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        "postgresql://postgres:postgres@localhost:5432/my_store",
    },
  }),

  plugins,

  endpoints: [
    {
      path: "/migrate",
      method: "get",
      handler: async (req, res) => {
        const db = req.payload.db as any;
        const pool = db.pool ?? db.drizzle?.session?.client ?? db.client;
        const dbKeys = Object.keys(db);
        if (!pool?.query) {
          res.json({ error: "pool not found", dbKeys });
          return;
        }
        const results: Record<string, string> = {};
        const run = async (label: string, sql: string) => {
          try { await pool.query(sql); results[label] = "ok"; }
          catch (e: any) { results[label] = e.message; }
        };
        // Products
        await run("badge_col", "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge varchar DEFAULT 'none'");
        // Settings — drop orphan tables if they exist from old array fields
        await run("drop_social_links", "DROP TABLE IF EXISTS settings_social_links CASCADE");
        await run("drop_notif_emails", "DROP TABLE IF EXISTS settings_order_notification_emails CASCADE");
        // Settings — add new flat social columns
        const socialCols = ["instagram_url","twitter_url","facebook_url","tiktok_url","youtube_url","telegram_url","whatsapp_url","order_notification_emails"];
        for (const col of socialCols) {
          await run(`settings_${col}`, `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ${col} varchar`);
        }
        res.json({ ok: true, results });
      },
    },
    {
      path: "/preview-redirect",
      method: "get",
      handler: (req, res) => {
        const slug = req.query?.slug as string | undefined;
        const collection = (req.query?.collection as string | undefined) ?? "products";
        const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
        const secret = process.env.PREVIEW_SECRET || "";
        const target = `${storefrontUrl}/api/preview?secret=${encodeURIComponent(secret)}&collection=${encodeURIComponent(collection)}${slug ? `&slug=${encodeURIComponent(slug)}` : ""}`;
        res.redirect(target);
      },
    },
  ],

  collections: [
    Products,
    Categories,
    Subcategories,
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
