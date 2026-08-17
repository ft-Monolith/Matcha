import type { HealthDTO } from "@common/dto/health.dto";
import type { UserDTO } from "@common/dto/user.dto";
import type { MyProfileDTO, ProfileDTO } from "@common/dto/profile.dto";
import type { UserEntity } from "../../database/entities/user.entity";
import type { ProfileEntity } from "../../database/entities/profile.entity";
import type { TagEntity } from "../../database/entities/tag.entity";
import type { PictureEntity } from "../../database/entities/picture.entity";


export interface HealthSnapshot {
  dbUp: boolean;
  uptimeSeconds: number;
}

export interface ProfileAggregate {
  user: UserEntity;
  profile: ProfileEntity | null;
  tags: TagEntity[];
  pictures: PictureEntity[];
}

export class TransformersService {
  healthToDTO(snapshot: HealthSnapshot): HealthDTO {
    const { dbUp, uptimeSeconds } = snapshot;

    return {
      status: dbUp ? "ok" : "degraded",
      db: dbUp ? "up" : "down",
      uptime: Math.floor(uptimeSeconds),
    };
  }

  userToDTO(user: UserEntity): UserDTO {
    const { id, username, first_name, last_name, email_verified, onboarded, created_at } = user;

    return {
      id,
      username,
      firstName: first_name,
      lastName: last_name,
      emailVerified: email_verified,
      onboarded,
      createdAt: created_at.toISOString(),
    };
  }

  profileToDTO(agg: ProfileAggregate): ProfileDTO {
    const { user, profile, tags, pictures } = agg;

    return {
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      gender: profile?.gender ?? null,
      sexualPref: profile?.sexual_pref ?? "bi",
      biography: profile?.biography ?? null,
      birthdate: profile?.birthdate ? this.toISODate(profile.birthdate) : null,
      city: profile?.city ?? null,
      tags: tags.map((t) => ({ id: t.id, name: t.name })),
      pictures: pictures.map((p) => ({
        id: p.id,
        url: `/uploads/${p.filename}`,
        isProfile: p.is_profile,
      })),
    };
  }

  myProfileToDTO(agg: ProfileAggregate): MyProfileDTO {
    return {
      ...this.profileToDTO(agg),
      email: agg.user.email,
      latitude: agg.profile?.latitude ?? null,
      longitude: agg.profile?.longitude ?? null,
      locationConsent: agg.profile?.location_consent ?? false,
    };
  }

  private toISODate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
