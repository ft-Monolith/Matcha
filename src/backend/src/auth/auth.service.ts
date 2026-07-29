import argon2 from "argon2";
import type { RegisterDTO } from "@common/dto/register.dto";
import type { UserDTO } from "@common/dto/user.dto";
import type { UserRepository } from "../database/repositories/user.repository";
import type { EmailVerificationTokenRepository } from "../database/repositories/emailVerificationToken.repository";
import type { TransformersService } from "../app/services/transformers.service";
import type { MailerService } from "../app/services/mailer.service";
import { generateToken, hashToken } from "../app/tokens";
import { env } from "../app/config/env";
import { HttpError } from "../app/http-error";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: EmailVerificationTokenRepository,
    private readonly mailer: MailerService,
    private readonly transformers: TransformersService,
  ) {}


  async register(input: RegisterDTO): Promise<UserDTO> {
    const taken = await this.users.existsByEmailOrUsername(input.email, input.username);
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

  private async sendVerificationEmail(userId: string, email: string, firstName: string) {
    const { token, tokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    await this.tokens.create(userId, tokenHash, expiresAt);

    const link = `${env.appUrl}/verify-email?token=${token}`;

    try {
      await this.mailer.send(
        email,
        "Verify your Matcha account",
        `<p>Hi ${firstName},</p>
         <p>Welcome to Matcha! Please confirm your email address by clicking the link below:</p>
         <p><a href="${link}">Verify my account</a></p>
         <p>This link expires in 24 hours.</p>`,
      );
    } catch (err) {
      console.error("[auth] verification email failed:", err);
    }
  }
}
