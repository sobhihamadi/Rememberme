import { Response } from "express";
import * as jwt from "jsonwebtoken";
import ms from "ms";
import config from "../config";
import { userPayload } from "../config/db_mode";
import {
  ExpiredTokenException,
  InvalidTokenException,
} from "../util/exceptions/http/AuthenticationException";
import { serviceexception } from "../util/exceptions/http/ServiceException";

// Single source of truth for the cookie name — referenced in every method
// so a future rename only requires changing this one constant.
const REFRESH_COOKIE_NAME = "refreshToken";
const ACCESS_COOKIE_NAME  = "token";

export class AuthenticationService {
  constructor(
    private secretkey           = config.auth.secretkey,
    private tokenExpiry         = config.auth.tokenExpiry,
    private tokenRefreshExpiry  = config.auth.tokenrefrechExpiry
  ) {}

  // ── Token generation ────────────────────────────────────────────────────────

  generatetoken(payload: userPayload): string {
    return jwt.sign(payload, this.secretkey, {
      expiresIn: this.tokenExpiry,
    });
  }

  generateRefreshToken(payload: userPayload): string {
    return jwt.sign({ payload }, this.secretkey, {
      expiresIn: this.tokenRefreshExpiry,
    });
  }

  // ── Token verification ──────────────────────────────────────────────────────

  verifyToken(token: string): userPayload {
    try {
      return jwt.verify(token, this.secretkey) as userPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) throw new ExpiredTokenException();
      if (error instanceof jwt.JsonWebTokenError)  throw new InvalidTokenException();
      throw new serviceexception("Token verification failed");
    }
  }

  // ── Cookie helpers ──────────────────────────────────────────────────────────

SetTokenIntoCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure:   config.isProduction,
    sameSite: config.isProduction ? "none" : "strict",
    maxAge:   ms(this.tokenExpiry),
  });
}

SetRefreshTokenIntoCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure:   config.isProduction,
    sameSite: config.isProduction ? "none" : "strict",
    maxAge:   ms(this.tokenRefreshExpiry),
  });
}

  /**
   * Clears BOTH cookies.
   * Previously "refrechToken" was used during set but "refreshToken" during
   * clear — meaning logout never actually removed the refresh cookie.
   * Both now use the REFRESH_COOKIE_NAME constant.
   */
 clearToken(res: Response): void {
  const options = {
    httpOnly: true,
    secure:   config.isProduction,
    sameSite: config.isProduction ? "none" as const : "strict" as const,
  };
  res.clearCookie(ACCESS_COOKIE_NAME, options);
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}

  // ── Combined helpers ────────────────────────────────────────────────────────

  PersistAuthentication(res: Response, payload: userPayload): void {
    const accessToken  = this.generatetoken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    this.SetTokenIntoCookie(res, accessToken);
    this.SetRefreshTokenIntoCookie(res, refreshToken);
  }

  // ✅ Fix — strip exp and iat before generating new token
// ✅ Fix — unwrap the nested payload before generating new token
refreshToken(refrechtoken: string): string {
    const decoded = this.verifyToken(refrechtoken) as any;
    if (!decoded) {
        throw new InvalidTokenException();
    }

    // generaterefrechtoken wraps as { payload: {...} }
    // so decoded is { payload: { userId, role }, exp, iat }
    const cleanPayload: userPayload = decoded.payload ?? decoded;

    // Validate the unwrapped payload has what we need
    if (!cleanPayload.userId || !cleanPayload.role) {
        throw new InvalidTokenException();
    }

    return this.generatetoken(cleanPayload);
}
}