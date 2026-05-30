import path from "path";
import type { StringValue } from "ms";

// Only load .env file locally — CI and Render inject env vars directly.
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require("dotenv");
  // Loads plain ".env" — works whether NODE_ENV is "development", "test", or unset
  dotenv.config({
    path: path.join(__dirname, "../../.env"),
  });
}

export default {
  NODE_ENV:     process.env.NODE_ENV || "development",
  isDev:        process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  port: parseInt(process.env.PORT || "3000", 10),

  logDir: "logs",

  storagePath: {
    postgres: {
      url: process.env.DATABASE_URL || "",
    },
  },

  auth: {
    secretkey:           process.env.JWT_SECRET_KEY         || "",
    tokenExpiry:        (process.env.TOKEN_EXPIRY           || "15m") as StringValue,
    tokenrefrechExpiry: (process.env.TOKEN_REFRECH_EXPIRY   || "7d")  as StringValue,
  },

  encryption: {
    secretKey: process.env.ENCRYPTION_SECRET || "",
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
};