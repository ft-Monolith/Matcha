import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import type {
  AddPhotoDTO,
  MyProfileDTO,
  SetTagsDTO,
  UpdateAccountDTO,
  UpdateLocationDTO,
  UpdateProfileDTO,
} from "@common/dto/profile.dto";
import type { UserDTO } from "@common/dto/user.dto";
import { env } from "../app/config/env";
import { HttpError } from "../app/http-error";
import type { TransformersService } from "../app/services/transformers.service";
import type { UserRepository } from "../database/repositories/user.repository";
import type { ProfileRepository } from "../database/repositories/profile.repository";
import type { TagRepository } from "../database/repositories/tag.repository";
import type { PictureRepository } from "../database/repositories/picture.repository";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 Mo
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly tags: TagRepository,
    private readonly pictures: PictureRepository,
    private readonly transformers: TransformersService,
  ) {}

  async getMe(userId: string): Promise<MyProfileDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new HttpError(404, "User not found");

    const [profile, tags, pictures] = await Promise.all([
      this.profiles.findByUserId(userId),
      this.tags.findByUserId(userId),
      this.pictures.findByUserId(userId),
    ]);

    return this.transformers.myProfileToDTO({ user, profile, tags, pictures });
  }

  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<MyProfileDTO> {
    const current = await this.profiles.findByUserId(userId);

    await this.profiles.upsert(userId, {
      gender: dto.gender !== undefined ? dto.gender : (current?.gender ?? null),
      sexual_pref: dto.sexualPref !== undefined ? dto.sexualPref : (current?.sexual_pref ?? "bi"),
      biography: dto.biography !== undefined ? dto.biography : (current?.biography ?? null),
      birthdate:
        dto.birthdate !== undefined
          ? dto.birthdate
          : current?.birthdate
            ? current.birthdate.toISOString().slice(0, 10)
            : null,
    });

    return this.getMe(userId);
  }

  async updateAccount(userId: string, dto: UpdateAccountDTO): Promise<MyProfileDTO> {
    try {
      await this.users.updateAccount(userId, {
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
      });
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
        throw new HttpError(409, "Email already in use");
      }
      throw err;
    }

    return this.getMe(userId);
  }


  async updateLocation(userId: string, dto: UpdateLocationDTO): Promise<MyProfileDTO> {
    await this.profiles.updateLocation(userId, {
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      city: dto.city ?? null,
      location_consent: dto.consent ?? false,
    });

    return this.getMe(userId);
  }

  async completeOnboarding(userId: string): Promise<UserDTO> {
    const [profile, tags, pictures] = await Promise.all([
      this.profiles.findByUserId(userId),
      this.tags.findByUserId(userId),
      this.pictures.findByUserId(userId),
    ]);

    const missing: string[] = [];
    if (!profile?.gender) missing.push("gender");
    if (!profile?.birthdate) missing.push("birthdate");
    if (!profile?.biography || profile.biography.trim() === "") missing.push("biography");
    if (!profile?.city) missing.push("location");
    if (tags.length === 0) missing.push("at least one tag");
    if (pictures.length === 0) missing.push("at least one photo");

    if (missing.length > 0) {
      throw new HttpError(400, "Profile is incomplete", missing);
    }

    const user = await this.users.markOnboarded(userId);
    return this.transformers.userToDTO(user);
  }

  async setTags(userId: string, dto: SetTagsDTO): Promise<MyProfileDTO> {
    const names = [...new Set(dto.tags.map((t) => t.toLowerCase()))];
    await this.tags.setUserTags(userId, names);
    return this.getMe(userId);
  }

  async addPhoto(userId: string, dto: AddPhotoDTO): Promise<MyProfileDTO> {
    const count = await this.pictures.countByUserId(userId);
    if (count >= MAX_PHOTOS) throw new HttpError(400, `Maximum ${MAX_PHOTOS} photos allowed`);

    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dto.data);
    if (!match) throw new HttpError(400, "Unsupported image format");

    const [, mime, payload] = match;
    const buffer = Buffer.from(payload, "base64");
    if (buffer.length === 0) throw new HttpError(400, "Empty image");
    if (buffer.length > MAX_PHOTO_BYTES) throw new HttpError(400, "Image too large (max 5MB)");

    const filename = `${randomUUID()}.${MIME_TO_EXT[mime]}`;
    await writeFile(join(env.uploadsDir, filename), buffer);

    await this.pictures.create({
      user_id: userId,
      filename,
      is_profile: count === 0,
      position: count,
    });

    return this.getMe(userId);
  }

  async deletePhoto(userId: string, pictureId: string): Promise<MyProfileDTO> {
    const picture = await this.pictures.findById(pictureId);
    if (!picture || picture.user_id !== userId) throw new HttpError(404, "Photo not found");

    const count = await this.pictures.countByUserId(userId);
    if (count <= 1) throw new HttpError(400, "You must keep at least one photo");

    await this.pictures.delete(pictureId);
    await unlink(join(env.uploadsDir, picture.filename)).catch(() => {});

    if (picture.is_profile) {
      const remaining = await this.pictures.findByUserId(userId);
      if (remaining.length > 0) {
        await this.pictures.setProfile(userId, remaining[0].id);
      }
    }

    return this.getMe(userId);
  }

  async setProfilePhoto(userId: string, pictureId: string): Promise<MyProfileDTO> {
    const picture = await this.pictures.findById(pictureId);
    if (!picture || picture.user_id !== userId) throw new HttpError(404, "Photo not found");

    await this.pictures.setProfile(userId, pictureId);
    return this.getMe(userId);
  }
}
