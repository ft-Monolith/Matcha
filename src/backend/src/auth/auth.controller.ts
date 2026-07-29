import type { Request, Response, Router } from "express";
import { RegisterDTO } from "@common/dto/register.dto";
import { VerifyEmailDTO } from "@common/dto/register.dto";
import type { AuthService } from "./auth.service";
import { validate } from "../app/middlewares/validate";


export class AuthController {
  constructor(private readonly service: AuthService) {}

  register(router: Router) {
    router.post("/register", validate(RegisterDTO), this.registerHandler);
    router.post("/verify", validate(VerifyEmailDTO), this.verifyHandler);
  }

  private registerHandler = async (req: Request, res: Response) => {
    const user = await this.service.register(req.body as RegisterDTO);
    res.status(201).json(user);
  };

  private verifyHandler = async (req: Request, res: Response) => {
    await this.service.verifyEmail((req.body as VerifyEmailDTO).token);
    res.status(200).json({ verified: true });
  };
}
