import { IsString, Length } from "class-validator";
import type { ProfilePreviewDTO } from "./profile.dto";

export interface MessageDTO {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface ConversationDTO {
  user: ProfilePreviewDTO;
  lastMessage: MessageDTO | null;
  unread: number;
}

export class SendMessageDTO {
  @IsString()
  @Length(1, 1000, { message: "Message must be between 1 and 1000 characters" })
  content!: string;
}
