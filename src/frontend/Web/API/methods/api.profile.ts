import type {
  AddPhotoDTO,
  MyProfileDTO,
  SetTagsDTO,
  UpdateAccountDTO,
  UpdateLocationDTO,
  UpdateProfileDTO,
} from "@common/dto/profile.dto";
import type { UserDTO } from "@common/dto/user.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI } from "../interface";

export class APIProfile extends IAPI {
  getMe(): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>("GET", Routes.Profile.Me);
  }

  updateProfile(body: UpdateProfileDTO): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>("PUT", Routes.Profile.Update, { body });
  }

  updateAccount(body: UpdateAccountDTO): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>("PATCH", Routes.Profile.Account, { body });
  }

  setTags(body: SetTagsDTO): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>("PUT", Routes.Profile.Tags, { body });
  }

  updateLocation(body: UpdateLocationDTO): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>("PUT", Routes.Profile.Location, { body });
  }

  completeOnboarding(): Promise<APIResponse<UserDTO>> {
    return this.fetch<UserDTO>("POST", Routes.Profile.Onboarding);
  }

  addPhoto(body: AddPhotoDTO): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>("POST", Routes.Profile.Photos, { body });
  }

  deletePhoto(id: string): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>(
      "DELETE",
      Routes.Profile.Photo.replace(":id", id),
    );
  }

  setProfilePhoto(id: string): Promise<APIResponse<MyProfileDTO>> {
    return this.fetch<MyProfileDTO>(
      "PATCH",
      Routes.Profile.PhotoProfile.replace(":id", id),
    );
  }
}
