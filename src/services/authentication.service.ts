import { Response } from "express";
import * as jwt from "jsonwebtoken";
import ms from "ms";
import config from "../config";
import { userPayload } from "../config/db_mode";
import { ExpiredTokenException, InvalidTokenException } from "../util/exceptions/http/AuthenticationException";
import { serviceexception } from "../util/exceptions/http/ServiceException";

export class AuthenticationService {
  constructor(
    private secretkey = config.auth.secretkey,
    private tokenExpiry = config.auth.tokenExpiry,
    private tokenrefrechExpiry = config.auth.tokenrefrechExpiry
  ) {}

  generatetoken(payload: userPayload): string {
    return jwt.sign(payload, this.secretkey, {
      expiresIn: this.tokenExpiry,
    });
  }

  generaterefrechtoken(payload: userPayload): string {
    return jwt.sign({ payload }, this.secretkey, {
      expiresIn: this.tokenrefrechExpiry,
    });
  }

  verifyToken(token: string): userPayload {
    try {
      return jwt.verify(token, this.secretkey) as userPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ExpiredTokenException();
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenException();
      }
      throw new serviceexception("Token verification failed");
    }
  }

  SetTokenIntoCookie(res: Response, token: string) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: ms(this.tokenExpiry),
    });
  }

  SetrefrechtokenIntoCookie(res: Response, reftoken: string) {
    res.cookie("refrechToken", reftoken, {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: ms(this.tokenrefrechExpiry),
    });
  }

  clearToken(res: Response) {
    res.clearCookie("token");
    res.clearCookie("refreshToken");
  }

  PersistAuthentication(res: Response, tokenpayload: userPayload) {
    const token = this.generatetoken(tokenpayload);
    this.SetTokenIntoCookie(res, token);
    const refrechtoken = this.generaterefrechtoken(tokenpayload);
    this.SetrefrechtokenIntoCookie(res, refrechtoken);
  }

  refreshToken(refrechtoken: string): string {
    const TokenPayload = this.verifyToken(refrechtoken);
    if (!TokenPayload) {
      throw new InvalidTokenException();
    }
    return this.generatetoken(TokenPayload);
  }
}