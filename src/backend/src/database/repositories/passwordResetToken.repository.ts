import type { Sql } from "../client";


export class PasswordResetTokenRepository {
  constructor(private readonly sql: Sql) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.sql.begin(async (tx) => {
      await tx`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
      await tx`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${userId}, ${tokenHash}, ${expiresAt})
      `;
    });
  }

  async consumeValid(tokenHash: string): Promise<string | null> {
    const rows = await this.sql<{ user_id: string }[]>`
      DELETE FROM password_reset_tokens
      WHERE token_hash = ${tokenHash} AND expires_at > now()
      RETURNING user_id
    `;
    return rows.length ? rows[0].user_id : null;
  }
}
