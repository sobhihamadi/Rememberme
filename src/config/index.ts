import path from "path";
import type { StringValue } from "ms";

// Load .env only in development — CI sets NODE_ENV=test and injects vars
// directly via the workflow, production uses platform env vars (Render).
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config({
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
    secretkey:           process.env.JWT_SECRET_KEY        || "",
    tokenExpiry:        (process.env.TOKEN_EXPIRY          || "15m") as StringValue,
    tokenrefrechExpiry: (process.env.TOKEN_REFRECH_EXPIRY  || "7d")  as StringValue,
  },

  encryption: {
    secretKey: process.env.ENCRYPTION_SECRET || "",
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
};