import type { RegisterDTO, VerifyEmailDTO } from "@common/dto/register.dto";
import type { LoginDTO } from "@common/dto/login.dto";
import type {
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from "@common/dto/reset-password.dto";
import type { UserDTO } from "@common/dto/user.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI, type APIOptions } from "../interface";

export class APIAuth extends IAPI {
  register(body: RegisterDTO): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("POST", Routes.Auth.Register, { body });
  }

  verifyEmail(
    body: VerifyEmailDTO,
  ): Promise<APIResponse<{ verified: boolean }>> {
    return this.fetch("POST", Routes.Auth.Verify, { body });
  }

  login(body: LoginDTO): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("POST", Routes.Auth.Login, { body });
  }

  refresh(): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("POST", Routes.Auth.Refresh);
  }

  logout(): Promise<APIResponse<{ ok: boolean }>> {
    return this.fetch("POST", Routes.Auth.Logout);
  }

  me(options?: APIOptions): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("GET", Routes.Auth.Me, options);
  }

  forgotPassword(
    body: ForgotPasswordDTO,
  ): Promise<APIResponse<{ message: string }>> {
    return this.fetch("POST", Routes.Auth.ForgotPassword, { body });
  }

  resetPassword(body: ResetPasswordDTO): Promise<APIResponse<{ ok: boolean }>> {
    return this.fetch("POST", Routes.Auth.ResetPassword, { body });
  }
}
