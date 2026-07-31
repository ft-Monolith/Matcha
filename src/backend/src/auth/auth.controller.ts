import type { Request, Response, Router } from "express";
import { RegisterDTO, VerifyEmailDTO } from "@common/dto/register.dto";
import { LoginDTO } from "@common/dto/login.dto";
import type { AuthService } from "./auth.service";
import { validate } from "../app/middlewares/validate";
import { authGuard } from "../app/middlewares/authGuard";
import { getSession } from "../app/session";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "../app/cookies";
import { verifyRefreshToken } from "../app/jwt";
import { HttpError } from "../app/http-error";


export class AuthController {
  constructor(private readonly service: AuthService) {}

  register(router: Router) {
    router.post("/register", validate(RegisterDTO), this.registerHandler);
    router.post("/verify", validate(VerifyEmailDTO), this.verifyHandler);
    router.post("/login", validate(LoginDTO), this.loginHandler);
    router.post("/refresh", this.refreshHandler);
    router.post("/logout", this.logoutHandler);
    router.get("/me", authGuard, this.meHandler);
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
    const { accessToken, refreshToken, user } = await this.service.login(req.body as LoginDTO);
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

    const { accessToken, refreshToken, user } = await this.service.refresh(payload);
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
}
