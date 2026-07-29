import type { Sql } from "../client";
import type { UserEntity } from "../entities/user.entity";

export interface CreateUserInput {
  email: string;
  username: string;
  last_name: string;
  first_name: string;
  password_hash: string;
}

export class UserRepository {
  constructor(private readonly sql: Sql) {}

  async create(input: CreateUserInput): Promise<UserEntity> {
    const [user] = await this.sql<UserEntity[]>`
      INSERT INTO users (email, username, last_name, first_name, password_hash)
      VALUES (
        ${input.email},
        ${input.username},
        ${input.last_name},
        ${input.first_name},
        ${input.password_hash}
      )
      RETURNING *
    `;
    return user;
  }

  async existsByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<{ email: boolean; username: boolean }> {
    const rows = await this.sql<{ email: string; username: string }[]>`
      SELECT email, username
      FROM users
      WHERE email = ${email} OR username = ${username}
    `;

    return {
      email: rows.some((r) => r.email.toLowerCase() === email.toLowerCase()),
      username: rows.some((r) => r.username.toLowerCase() === username.toLowerCase()),
    };
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.sql`
      UPDATE users
      SET email_verified = true, updated_at = now()
      WHERE id = ${userId}
    `;
  }
}
