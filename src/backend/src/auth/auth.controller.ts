import type { Request, Response, Router } from "express";
import { RegisterDTO, VerifyEmailDTO } from "@common/dto/register.dto";
import { LoginDTO } from "@common/dto/login.dto";
import {
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from "@common/dto/reset-password.dto";
import type { AuthService } from "./auth.service";
import { validate } from "../app/middlewares/validate";
import { authGuard } from "../app/middlewares/authGuard";
import { rateLimit } from "../app/middlewares/rateLimit";
import { getSession } from "../app/session";
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "../app/cookies";
import { verifyRefreshToken } from "../app/jwt";
import { HttpError } from "../app/http-error";

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again in a few minutes",
});
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many requests, please try again later",
});

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register(router: Router) {
    router.post(
      "/register",
      registerLimiter,
      validate(RegisterDTO),
      this.registerHandler,
    );
    router.post("/verify", validate(VerifyEmailDTO), this.verifyHandler);
    router.post("/login", loginLimiter, validate(LoginDTO), this.loginHandler);
    router.post("/refresh", this.refreshHandler);
    router.post("/logout", this.logoutHandler);
    router.get("/me", authGuard, this.meHandler);
    router.post(
      "/forgot-password",
      emailLimiter,
      validate(ForgotPasswordDTO),
      this.forgotPasswordHandler,
    );
    router.post(
      "/reset-password",
      loginLimiter,
      validate(ResetPasswordDTO),
      this.resetPasswordHandler,
    );
  }

  private registerHandler = async (req: Request, res: Response) => {
    const user = await this.service.register(req.body as RegisterDTO);
    res.status(201).json(user);
  };

  private verifyHandler = async (req: Request, res: Response) => {
    await this.service.verifyEmail((req.body as VerifyEmailDTO).token);
    res.status(200).json({ verified: true });
  };

  private loginHandler = async (req: Request, res: Response) => {
    const { accessToken, refreshToken, user } = await this.service.login(
      req.body as LoginDTO,
    );
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json(user);
  };

  private refreshHandler = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new HttpError(401, "No refresh token");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new HttpError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken, user } =
      await this.service.refresh(payload);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json(user);
  };

  private logoutHandler = async (_req: Request, res: Response) => {
    clearAuthCookies(res);
    res.status(200).json({ ok: true });
  };

  private meHandler = async (req: Request, res: Response) => {
    const session = getSession(req);
    res.status(200).json(await this.service.getMe(session.userId));
  };

  private forgotPasswordHandler = async (req: Request, res: Response) => {
    await this.service.requestPasswordReset(
      (req.body as ForgotPasswordDTO).email,
    );
    res
      .status(200)
      .json({ message: "If an account exists, a reset link has been sent" });
  };

  private resetPasswordHandler = async (req: Request, res: Response) => {
    const { token, password } = req.body as ResetPasswordDTO;
    await this.service.resetPassword(token, password);
    res.status(200).json({ ok: true });
  };
}
