import { NextFunction, Request, Response } from "express";
import { AuthenticationService } from "../services/authentication.service";
import { authRequest } from "../config/db_mode";
import { AuthenticationFailedException } from "../util/exceptions/http/AuthenticationException";

const authService = new AuthenticationService();

/**
 * Authentication middleware.
 *
 * Reads the access token from the httpOnly cookie.
 * If it's missing but a refresh token is present, silently issues a new one.
 * Attaches the decoded payload to req.user so downstream middleware
 * and controllers can read req.user.userId / req.user.role.
 *
 * Throws AuthenticationFailedException (→ 401) if no valid token exists at all.
 */
export function Authentication(req: Request, _res: Response, next: NextFunction): void {
    try {
        let token: string = req.cookies?.token;
        const refreshToken: string = req.cookies?.refreshToken;

        if (!token) {
            if (!refreshToken) {
                throw new AuthenticationFailedException();
            }

            // Silently rotate: verify the refresh token and mint a new access token
            const newToken = authService.refreshToken(refreshToken);
            authService.SetTokenIntoCookie(_res, newToken);
            token = newToken;
        }

        const payload = authService.verifyToken(token);
        (req as authRequest).user = payload;

        next();
    } catch (error) {
        next(error);
    }
}