import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import type {
  AddPhotoDTO,
  MyProfileDTO,
  ProfileDTO,
  ProfilePreviewDTO,
  SetTagsDTO,
  UpdateAccountDTO,
  UpdateLocationDTO,
  UpdateProfileDTO,
} from "@common/dto/profile.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import type { SearchParams } from "@common/dto/search.dto";
import type { UserDTO } from "@common/dto/user.dto";
import { env } from "../app/config/env";
import { HttpError } from "../app/http-error";
import { detectImageMime } from "../app/image";
import type { TransformersService } from "../app/services/transformers.service";
import type { UserRepository } from "../database/repositories/user.repository";
import type { ProfileRepository } from "../database/repositories/profile.repository";
import type { TagRepository } from "../database/repositories/tag.repository";
import type { PictureRepository } from "../database/repositories/picture.repository";
import type { LikeRepository } from "../database/repositories/like.repository";
import type { VisitRepository } from "../database/repositories/visit.repository";
import type { ReportRepository } from "../database/repositories/report.repository";
import { computeFame } from "@common/constant/fame";
import type { PresenceService } from "../app/realtime/presence.service";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 Mo
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class ProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly tags: TagRepository,
    private readonly pictures: PictureRepository,
    private readonly likes: LikeRepository,
    private readonly visits: VisitRepository,
    private readonly reports: ReportRepository,
    private readonly transformers: TransformersService,
    private readonly presence: PresenceService,
  ) {}

  async getMe(userId: string): Promise<MyProfileDTO> {
    const user = await this.users.findById(userId);
    if (!user) throw new HttpError(404, "User not found");

    const [profile, tags, pictures, likesReceived, visitsReceived, reportsReceived] =
      await Promise.all([
        this.profiles.findByUserId(userId),
        this.tags.findByUserId(userId),
        this.pictures.findByUserId(userId),
        this.likes.countReceived(userId),
        this.visits.countReceived(userId),
        this.reports.countReceived(userId),
      ]);

    return this.transformers.myProfileToDTO(
      { user, profile, tags, pictures },
      this.presence.isOnline(userId),
      computeFame(likesReceived, visitsReceived, reportsReceived),
    );
  }

  async search(viewerId: string, params: SearchParams): Promise<Paginated<ProfilePreviewDTO>> {
    const viewer = await this.profiles.findByUserId(viewerId);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const offset = Math.max(params.offset ?? 0, 0);

    const { rows, total } = await this.profiles.search({
      viewerId,
      gender: viewer?.gender ?? null,
      pref: viewer?.sexual_pref ?? "bi",
      lat: viewer?.latitude ?? null,
      lng: viewer?.longitude ?? null,
      ageMin: params.ageMin ?? null,
      ageMax: params.ageMax ?? null,
      fameMin: params.fameMin ?? null,
      fameMax: params.fameMax ?? null,
      maxDistance: params.maxDistance ?? null,
      tags: params.tags && params.tags.length > 0 ? params.tags : null,
      hideFlagged: params.hideFlagged ?? true,
      sort: params.sort ?? "suggestion",
      order: params.order ?? "desc",
      limit,
      offset,
    });

    const items = rows.map((r) =>
      this.transformers.profilePreviewToDTO(r, this.presence.isOnline(r.user_id)),
    );

    return { items, totalCount: total, hasNextPage: offset + rows.length < total };
  }

  async getPublicProfile(viewerId: string, targetId: string): Promise<ProfileDTO> {
    const user = await this.users.findById(targetId);
    if (!user || !user.onboarded) throw new HttpError(404, "Profile not found");

    const [
      profile,
      viewerProfile,
      tags,
      pictures,
      likedByMe,
      likesMe,
      likesReceived,
      visitsReceived,
      reportsReceived,
    ] = await Promise.all([
      this.profiles.findByUserId(targetId),
      this.profiles.findByUserId(viewerId),
      this.tags.findByUserId(targetId),
      this.pictures.findByUserId(targetId),
      this.likes.exists(viewerId, targetId),
      this.likes.exists(targetId, viewerId),
      this.likes.countReceived(targetId),
      this.visits.countReceived(targetId),
      this.reports.countReceived(targetId),
    ]);

    const distance =
      profile?.latitude != null &&
      profile?.longitude != null &&
      viewerProfile?.latitude != null &&
      viewerProfile?.longitude != null
        ? Math.round(
            haversineKm(
              viewerProfile.latitude,
              viewerProfile.longitude,
              profile.latitude,
              profile.longitude,
            ) * 10,
          ) / 10
        : null;

    return this.transformers.profileToDTO(
      { user, profile, tags, pictures },
      this.presence.isOnline(targetId),
      likedByMe,
      likesMe,
      computeFame(likesReceived, visitsReceived, reportsReceived),
      distance,
    );
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
    const user = await this.users.findById(userId);
    if (user?.onboarded && (dto.latitude == null || dto.longitude == null)) {
      throw new HttpError(400, "A location is required — use GPS or pick a city");
    }

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
    if (!profile?.city || profile?.latitude == null || profile?.longitude == null)
      missing.push("location");
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

    const realMime = detectImageMime(buffer);
    if (realMime === null || realMime !== mime) {
      throw new HttpError(400, "Invalid image content");
    }

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
