import express from "express";
import payload from "payload";
import dotenv from "dotenv";
import path from "path";

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
