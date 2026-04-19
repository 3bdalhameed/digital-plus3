import express from "express";
import payload from "payload";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET!,
    express: app,
    onInit: async () => {
      payload.logger.info(
        `Payload Admin URL: ${payload.getAdminURL()}`
      );
    },
  });

  app.listen(PORT, () => {
    payload.logger.info(`Server running on port ${PORT}`);
  });
};

start();
