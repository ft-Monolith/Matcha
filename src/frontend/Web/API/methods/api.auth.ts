import type { RegisterDTO, VerifyEmailDTO } from "@common/dto/register.dto";
import type { LoginDTO } from "@common/dto/login.dto";
import type { ForgotPasswordDTO, ResetPasswordDTO } from "@common/dto/reset-password.dto";
import type { UserDTO } from "@common/dto/user.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI, type APIOptions } from "../interface";

export class APIAuth extends IAPI {
  /** POST /api/auth/register → crée le compte (non vérifié) + envoie l'e-mail. */
  register(body: RegisterDTO): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("POST", Routes.Auth.Register, { body });
  }

  /** POST /api/auth/verify → consomme le jeton du lien e-mail. */
  verifyEmail(body: VerifyEmailDTO): Promise<APIResponse<{ verified: boolean }>> {
    return this.fetch("POST", Routes.Auth.Verify, { body });
  }

  /** POST /api/auth/login → pose les cookies  et renvoie le user. */
  login(body: LoginDTO): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("POST", Routes.Auth.Login, { body });
  }

  /** POST /api/auth/refresh → renouvelle l'access token depuis le cookie refresh. */
  refresh(): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("POST", Routes.Auth.Refresh);
  }

  /** POST /api/auth/logout → efface les cookies (déconnexion). */
  logout(): Promise<APIResponse<{ ok: boolean }>> {
    return this.fetch("POST", Routes.Auth.Logout);
  }

  /** GET /api/auth/me → l'utilisateur courant (401 si non connecté). */
  me(options?: APIOptions): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("GET", Routes.Auth.Me, options);
  }

  /** POST /api/auth/forgot-password → envoie un lien de reset (réponse toujours générique). */
  forgotPassword(body: ForgotPasswordDTO): Promise<APIResponse<{ message: string }>> {
    return this.fetch("POST", Routes.Auth.ForgotPassword, { body });
  }

  /** POST /api/auth/reset-password → applique le nouveau mot de passe via le jeton. */
  resetPassword(body: ResetPasswordDTO): Promise<APIResponse<{ ok: boolean }>> {
    return this.fetch("POST", Routes.Auth.ResetPassword, { body });
  }
}
