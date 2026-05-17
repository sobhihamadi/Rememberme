import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async controller method so any unhandled rejection is
 * forwarded to Express's next() — which routes it to the global
 * error handler instead of crashing the process.
 *
 * Usage in a route file:
 *   router.get('/', asyncHandler(controller.getAll));
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
};