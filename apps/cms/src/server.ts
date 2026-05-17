import express from "express";
import payload from "payload";
import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

const start = async () => {
  // Redirect root to Admin panel
  app.get("/", (_, res) => {
    res.redirect("/admin");
  });

  await payload.init({
    secret: process.env.PAYLOAD_SECRET || "CHANGE-ME-super-secret-key-32chars",
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
      // Ensure columns added after initial schema push exist
      const migrationPool = new Pool({
        connectionString: process.env.DATABASE_URI,
      });
      try {
        await migrationPool.query(
          "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge varchar DEFAULT 'none'"
        );
        payload.logger.info("Schema check: products.badge column ready");
      } catch (e: any) {
        payload.logger.warn("Schema migration warning: " + e.message);
      } finally {
        await migrationPool.end();
      }
    },
  });

  app.listen(PORT, async () => {
    payload.logger.info(
      `Server started on http://localhost:${PORT}`
    );
  });
};

start().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
