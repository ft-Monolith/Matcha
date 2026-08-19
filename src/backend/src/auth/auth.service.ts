import argon2 from "argon2";
import type { RegisterDTO } from "@common/dto/register.dto";
import type { LoginDTO } from "@common/dto/login.dto";
import type { UserDTO } from "@common/dto/user.dto";
import type { UserRepository } from "../database/repositories/user.repository";
import type { EmailVerificationTokenRepository } from "../database/repositories/emailVerificationToken.repository";
import type { PasswordResetTokenRepository } from "../database/repositories/passwordResetToken.repository";
import type { TransformersService } from "../app/services/transformers.service";
import type { MailerService } from "../app/services/mailer.service";
import { generateToken, hashToken } from "../app/tokens";
import { signAccessToken, signRefreshToken, type JwtPayload } from "../app/jwt";
import { env } from "../app/config/env";
import { HttpError } from "../app/http-error";
import { escapeHtml } from "../app/html";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const RESET_TTL_MS = 60 * 60 * 1000; // 1 h

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: EmailVerificationTokenRepository,
    private readonly resetTokens: PasswordResetTokenRepository,
    private readonly mailer: MailerService,
    private readonly transformers: TransformersService,
  ) {}

  async register(input: RegisterDTO): Promise<UserDTO> {
    const taken = await this.users.existsByEmailOrUsername(
      input.email,
      input.username,
    );
    if (taken.email) throw new HttpError(409, "Email already in use");
    if (taken.username) throw new HttpError(409, "Username already taken");

    const password_hash = await argon2.hash(input.password);

    const user = await this.users.create({
      email: input.email,
      username: input.username,
      last_name: input.last_name,
      first_name: input.first_name,
      password_hash,
    });

    await this.sendVerificationEmail(user.id, input.email, input.first_name);

    return this.transformers.userToDTO(user);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.tokens.consumeValid(hashToken(token));
    if (!userId) {
      throw new HttpError(400, "Invalid or expired verification link");
    }
    await this.users.markEmailVerified(userId);
  }

  async login(input: LoginDTO): Promise<AuthTokens> {
    const user = await this.users.findByUsername(input.username);

    const hash =
      user?.password_hash ??
      "$argon2id$v=19$m=65536,t=3,p=4$aaaaaaaaaaaaaaaa$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    // c est une protection pour veriier le mdp meme si le user existepas
    // si on le fait pas l'attaquant peut savoir si le user existe ou pas en mesurant le temps de reponse
    // type comme un argon hash
    const ok = await argon2.verify(hash, input.password);

    if (!user || !ok) {
      throw new HttpError(401, "Invalid credentials");
    }

    if (!user.email_verified) {
      throw new HttpError(403, "Please verify your email before logging in");
    }

    return this.issueTokens({ sub: user.id, username: user.username }, user);
  }

  async refresh(payload: JwtPayload): Promise<AuthTokens> {
    const user = await this.users.findByUsername(payload.username);
    if (!user) {
      throw new HttpError(401, "Invalid session");
    }
    return this.issueTokens({ sub: user.id, username: user.username }, user);
  }

  async getMe(userId: string): Promise<UserDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new HttpError(404, "User not found");
    return this.transformers.userToDTO(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) return; // silencieux pas d erreur pour pas sortir de donner

    const { token, tokenHash } = generateToken();
    await this.resetTokens.create(
      user.id,
      tokenHash,
      new Date(Date.now() + RESET_TTL_MS),
    );

    const link = `${env.appUrl}/reset-password?token=${token}`;
    try {
      await this.mailer.send(
        email,
        "Reset your Matcha password",
        `<p>Hi ${escapeHtml(user.first_name)},</p>
         <p>You requested a password reset. Click the link below to choose a new password:</p>
         <p><a href="${link}">Reset my password</a></p>
         <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
      );
    } catch (err) {
      console.error("[auth] reset email failed:", err);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.resetTokens.consumeValid(hashToken(token));
    if (!userId) {
      throw new HttpError(400, "Invalid or expired reset link");
    }
    const password_hash = await argon2.hash(newPassword);
    await this.users.updatePassword(userId, password_hash);
  }

  private issueTokens(
    payload: JwtPayload,
    user: Parameters<TransformersService["userToDTO"]>[0],
  ): AuthTokens {
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: this.transformers.userToDTO(user),
    };
  }

  private async sendVerificationEmail(
    userId: string,
    email: string,
    firstName: string,
  ) {
    const { token, tokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    await this.tokens.create(userId, tokenHash, expiresAt);

    const link = `${env.appUrl}/verify-email?token=${token}`;

    try {
      await this.mailer.send(
        email,
        "Verify your Matcha account",
        `<p>Hi ${escapeHtml(firstName)},</p>
         <p>Welcome to Matcha! Please confirm your email address by clicking the link below:</p>
         <p><a href="${link}">Verify my account</a></p>
         <p>This link expires in 24 hours.</p>`,
      );
    } catch (err) {
      console.error("[auth] verification email failed:", err);
    }
  }
}
