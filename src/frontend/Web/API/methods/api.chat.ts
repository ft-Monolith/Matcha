import type { ConversationDTO, MessageDTO } from "@common/dto/chat.dto";
import type { Paginated } from "@common/dto/pagination.dto";
import { Routes } from "@common/routes/routes";
import type { APIResponse } from "../fetchAPI";
import { IAPI } from "../interface";

export class APIChat extends IAPI {
  conversations(): Promise<APIResponse<ConversationDTO[]>> {
    return this.fetch<ConversationDTO[]>("GET", Routes.Chat.Conversations);
  }

  history(id: string, limit: number, offset: number): Promise<APIResponse<Paginated<MessageDTO>>> {
    return this.fetch<Paginated<MessageDTO>>("GET", Routes.Chat.Thread.replace(":id", id), {
      query: { limit, offset },
    });
  }

  send(id: string, content: string): Promise<APIResponse<MessageDTO>> {
    return this.fetch<MessageDTO>("POST", Routes.Chat.Thread.replace(":id", id), {
      body: { content },
    });
  }

  markRead(id: string): Promise<APIResponse<void>> {
    return this.fetch<void>("POST", Routes.Chat.ThreadRead.replace(":id", id));
  }
}
