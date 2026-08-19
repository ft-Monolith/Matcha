import type { HealthDTO } from "@common/dto/health.dto";
import type { UserDTO } from "@common/dto/user.dto";
import type { MyProfileDTO, ProfileDTO, ProfilePreviewDTO } from "@common/dto/profile.dto";
import type { ConversationDTO, MessageDTO } from "@common/dto/chat.dto";
import type { NotificationDTO } from "@common/dto/notification.dto";
import type {
  ConversationRow,
  MessageRow,
} from "../../database/repositories/message.repository";
import type { NotificationRow } from "../../database/repositories/notification.repository";
import { computeFame } from "@common/constant/fame";
import type { UserEntity } from "../../database/entities/user.entity";
import type { ProfileEntity } from "../../database/entities/profile.entity";
import type { TagEntity } from "../../database/entities/tag.entity";
import type { PictureEntity } from "../../database/entities/picture.entity";
import type { ProfilePreviewRow } from "../../database/repositories/profile.repository";


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

  profileToDTO(
    agg: ProfileAggregate,
    online: boolean,
    likedByMe = false,
    likesMe = false,
    fame = 0,
  ): ProfileDTO {
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
      online,
      lastSeen: user.last_seen ? user.last_seen.toISOString() : null,
      likedByMe,
      likesMe,
      fame,
    };
  }

  myProfileToDTO(agg: ProfileAggregate, online: boolean, fame = 0): MyProfileDTO {
    return {
      ...this.profileToDTO(agg, online, false, false, fame),
      email: agg.user.email,
      latitude: agg.profile?.latitude ?? null,
      longitude: agg.profile?.longitude ?? null,
      locationConsent: agg.profile?.location_consent ?? false,
    };
  }

  profilePreviewToDTO(row: ProfilePreviewRow, online: boolean): ProfilePreviewDTO {
    return {
      userId: row.user_id,
      firstName: row.first_name,
      age: row.birthdate ? this.ageFrom(row.birthdate) : null,
      photo: row.photo ? `/uploads/${row.photo}` : null,
      online,
      fame: computeFame(row.likes_count, row.visits_count, row.reports_count),
      distance: row.distance_km == null ? null : Math.round(row.distance_km * 10) / 10,
    };
  }

  messageToDTO(row: MessageRow): MessageDTO {
    return {
      id: row.id,
      senderId: row.sender_id,
      content: row.content,
      createdAt: row.created_at.toISOString(),
      read: row.read_at !== null,
    };
  }

  conversationToDTO(row: ConversationRow, online: boolean): ConversationDTO {
    return {
      user: this.profilePreviewToDTO(row, online),
      lastMessage: row.last_id
        ? {
            id: row.last_id,
            senderId: row.last_sender_id!,
            content: row.last_content!,
            createdAt: row.last_created_at!.toISOString(),
            read: row.last_read_at !== null,
          }
        : null,
      unread: row.unread,
    };
  }

  notificationToDTO(row: NotificationRow): NotificationDTO {
    return {
      id: row.id,
      type: row.type,
      actor: {
        userId: row.actor_id,
        firstName: row.actor_first_name,
        photo: row.actor_photo ? `/uploads/${row.actor_photo}` : null,
      },
      read: row.read_at !== null,
      createdAt: row.created_at.toISOString(),
    };
  }

  private toISODate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private ageFrom(birthdate: Date): number {
    const now = new Date();
    let age = now.getFullYear() - birthdate.getFullYear();
    const m = now.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) age--;
    return age;
  }
}
