import type { Request, Response, Router } from "express";
import {
  AddPhotoDTO,
  SetTagsDTO,
  UpdateAccountDTO,
  UpdateLocationDTO,
  UpdateProfileDTO,
} from "@common/dto/profile.dto";
import type { ProfileService } from "./profile.service";
import { validate } from "../app/middlewares/validate";
import { authGuard } from "../app/middlewares/authGuard";
import { getSession } from "../app/session";

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  register(router: Router) {
    router.use(authGuard);

    router.get("/me", this.meHandler);
    router.put("/", validate(UpdateProfileDTO), this.updateHandler);
    router.patch("/account", validate(UpdateAccountDTO), this.accountHandler);

    router.put("/tags", validate(SetTagsDTO), this.setTagsHandler);
    router.put("/location", validate(UpdateLocationDTO), this.locationHandler);
    router.post("/onboarding", this.onboardingHandler);

    router.post("/photos", validate(AddPhotoDTO), this.addPhotoHandler);
    router.delete("/photos/:id", this.deletePhotoHandler);
    router.patch("/photos/:id/profile", this.setProfilePhotoHandler);
  }

  private meHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.getMe(userId));
  };

  private updateHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.updateProfile(userId, req.body as UpdateProfileDTO));
  };

  private accountHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.updateAccount(userId, req.body as UpdateAccountDTO));
  };

  private setTagsHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.setTags(userId, req.body as SetTagsDTO));
  };

  private locationHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.updateLocation(userId, req.body as UpdateLocationDTO));
  };

  private onboardingHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.completeOnboarding(userId));
  };

  private addPhotoHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(201).json(await this.service.addPhoto(userId, req.body as AddPhotoDTO));
  };

  private deletePhotoHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.deletePhoto(userId, String(req.params.id)));
  };

  private setProfilePhotoHandler = async (req: Request, res: Response) => {
    const { userId } = getSession(req);
    res.status(200).json(await this.service.setProfilePhoto(userId, String(req.params.id)));
  };
}
