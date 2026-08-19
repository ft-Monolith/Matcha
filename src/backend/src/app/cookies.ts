import type { CookieOptions, Response } from "express";
import { isProd } from "./config/env";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const ACCESS_MAX_AGE = 2 * 60 * 60 * 1000; // 2h
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function cookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge,
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
}

export function clearAuthCookies(res: Response) {
  const opts: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
  };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}
