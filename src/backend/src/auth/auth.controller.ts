import type { Request, Response, Router } from "express";
import { RegisterDTO } from "@common/dto/register.dto";
import type { AuthService } from "./auth.service";
import { validate } from "../app/middlewares/validate";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register(router: Router) {
    router.post("/register", validate(RegisterDTO), this.registerHandler);
  }

  private registerHandler = async (req: Request, res: Response) => {
    const user = await this.service.register(req.body as RegisterDTO);
    res.status(201).json(user);
  };
}
