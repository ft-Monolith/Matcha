export type NotificationType = "like" | "visit" | "match" | "unlike" | "message";

export interface NotificationActorDTO {
  userId: string;
  firstName: string;
  photo: string | null;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  actor: NotificationActorDTO;
  read: boolean;
  createdAt: string;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  unread: number;
  hasNextPage: boolean;
}
