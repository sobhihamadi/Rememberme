import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";

import config from "./config/index";
import routes from "./routes/Index.route";
import requestLogger from "./middleware/reQuesthAndler";
import { globalErrorHandler } from "./middleware/errrorHandler";
import logger from "./util/logger";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
// helmet sets ~15 HTTP headers that block common attacks (XSS, clickjacking, etc.)
// Must come first so every response gets the headers.
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allows the React frontend (running on a different port/domain) to call the API.
// In production, replace the origin with your actual domain.
app.use(
  cors({
    origin:      config.isProduction ? process.env.FRONTEND_URL : "http://localhost:5173",
    credentials: true, // required so the browser sends the httpOnly auth cookie
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser()); // must come before Authentication middleware reads cookies

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

// ── Global error handler ──────────────────────────────────────────────────────
// MUST be the last app.use() — Express identifies it as an error handler
// because it has four parameters (err, req, res, next).
app.use(globalErrorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(
    `VaultMind API running on port ${config.port} in ${config.NODE_ENV} mode`
  );
});

export default app; // exported for supertest in integration tests