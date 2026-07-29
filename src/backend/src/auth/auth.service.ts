import argon2 from "argon2";
import type { RegisterDTO } from "@common/dto/register.dto";
import type { UserDTO } from "@common/dto/user.dto";
import type { UserRepository } from "../database/repositories/user.repository";
import type { TransformersService } from "../app/services/transformers.service";
import { HttpError } from "../app/http-error";

export class AuthService {
  constructor(
    private readonly users: UserRepository,
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

    return this.transformers.userToDTO(user);
  }
}
