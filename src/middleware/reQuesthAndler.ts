import { NextFunction, Request, Response } from "express";
import logger from "../util/logger";

/**
 * Logs every HTTP request once the response has been sent.
 * Log level is determined by status code:
 *   5xx → error | 4xx → warn | everything else → info
 *
 * Mount this early in app.ts so it covers all routes:
 *   app.use(requestLogger);
 */
const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on("finish", () => {
        const responseTime = Date.now() - startTime;
        const status       = res.statusCode;
        const { method, originalUrl } = req;

        const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

        logger.log({
            level,
            message: `${method} ${status} ${originalUrl} — ${responseTime}ms`,
        });
    });

    next();
};

export default requestLogger;