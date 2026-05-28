import dotenv from "dotenv";
import path from "path";
import type { StringValue } from "ms";

dotenv.config({ path: path.join(__dirname, "../../.env") });

export default {
  NODE_ENV:     process.env.NODE_ENV || "development",
  isDev:        process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  port: parseInt(process.env.PORT || "3000", 10),

  logDir: "logs",

  storagePath: {
    postgres: {
      // WARNING: never commit a real connection string as a fallback in production.
      // The fallback here is only for local development convenience.
      // In production (DigitalOcean + PM2), DATABASE_URL must be set in the .env file.
      url:
        process.env.DATABASE_URL ||""    },
  },

  auth: {
    secretkey:           process.env.JWT_SECRET_KEY    || "secret-111222242421",
    tokenExpiry:        (process.env.TOKEN_EXPIRY       || "15m") as StringValue,
    tokenrefrechExpiry: (process.env.TOKEN_REFRECH_EXPIRY || "7d") as StringValue,
  },

  encryption: {
    // Used by VaultService for AES-256-CBC encryption of vault item content.
    // Must be exactly 32 bytes when decoded. Generate with:
    //   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    secretKey: process.env.ENCRYPTION_SECRET || "",
  },

  // Used by the AI service to call the gemini API (Gemini).
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
};