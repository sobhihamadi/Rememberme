import { Request, Response, Router } from "express";
import AuthRoutes  from "./auth.route";
import UserRoutes  from "./user.route";
import VaultRoutes from "./vault.route";
import ChatRoutes  from "./chat.route";
import AiRoutes    from "./ai.route";

import { ConnectionManager } from "../repository/PostgreSql/ConnectionManager";
import logger from "../util/logger";

const routes = Router();

// ── Sub-routers ───────────────────────────────────────────────────────────────

/**
 * /api/v1/auth   → login, logout         (public)
 * /api/v1/users  → register, profile     (register is public, rest authenticated)
 * /api/v1/vault  → vault CRUD            (all authenticated)
 * /api/v1/chat   → chat history CRUD     (all authenticated)
 */

routes.use("/auth",  AuthRoutes);
routes.use("/users", UserRoutes);
routes.use("/vault", VaultRoutes);
routes.use("/chat",  ChatRoutes);
routes.use("/ai",    AiRoutes); // AI interactions are a special type of chat, handled in the same controller
logger.info("Routes mounted: /auth, /users, /vault, /chat, /ai");

// ── Health endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/health
 * Basic liveness probe — confirms the Express process is running.
 * Used by DigitalOcean health checks and PM2 monitor.
 */
routes.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        status:  "OK",
        message: "VaultMind API is healthy",
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /api/v1/health/db
 * Readiness probe — confirms the PostgreSQL connection is live.
 * A failed DB connection is caught and returned as 503 (not 500)
 * so load balancers can distinguish a crashed app from a degraded one.
 */
routes.get("/health/db", async (_req: Request, res: Response) => {
    try {
        const pool = await ConnectionManager.getPostgreConnection();
        await pool.query("SELECT 1"); // lightweight round-trip ping
        res.status(200).json({ status: "OK", database: "PostgreSQL connected" });
    } catch (error) {
        logger.error("Health check: database connection failed", error);
        res.status(503).json({
            status:  "UNAVAILABLE",
            database: "PostgreSQL unreachable",
        });
    }
});

export default routes;