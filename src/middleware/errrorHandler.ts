import { NextFunction, Request, Response } from "express";
import { HTTPException } from "../util/exceptions/http/HttpException";
import logger from "../util/logger";

/**
 * Global error-handling middleware.
 *
 * Must be the LAST app.use() call in app.ts — Express identifies it as
 * an error handler because it has four parameters (err, req, res, next).
 *
 * Catches every error forwarded via next(error) and converts it to a
 * clean JSON response. This is why controllers call next(error) instead
 * of writing res.status(500).json(...) themselves.
 */
export function globalErrorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof HTTPException) {
        // Known, intentional errors (BadRequest, NotFound, 401, 403, etc.)
        logger.warn(`[${err.name}] ${err.message}`, { details: err.details });

        res.status(err.status).json({
            error:   err.name,
            message: err.message,
            ...(err.details && { details: err.details }),
        });
        return;
    }

    // Unknown / unexpected errors — log the full stack
    logger.error(`[UnhandledError] ${err.message}`, { stack: err.stack });

    res.status(500).json({
        error:   "InternalServerError",
        message: "An unexpected error occurred. Please try again later.",
    });
}