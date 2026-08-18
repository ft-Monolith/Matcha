import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { ConversationDTO, MessageDTO } from "@common/dto/chat.dto";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { $user, $chatUnread, $openChatUser, $use } from "@web/observables/observables";
import { socket } from "@web/realtime/socket";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@shadcn/ui/avatar";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";
import { PresenceDot } from "@web/component/PresenceIndicator";
import { ProfileDialog } from "@web/component/ProfileDialog";

export function ChatView() {
  const me = $use($user);
  const myId = me?.id ?? "";
  const location = useLocation();
  const openUserId = (location.state as { openUserId?: string } | null)?.openUserId;
  const openedKeyRef = useRef<string | null>(null);

  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [selected, setSelected] = useState<ProfilePreviewDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [profileOpen, setProfileOpen] = useState<string | null>(null); // profil ouvert au clic sur l'avatar
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<ProfilePreviewDTO | null>(null);
  selectedRef.current = selected;

  const loadConversations = useCallback(() => {
    return API.chat.conversations().then((r) => {
      if (r.error) return;
      setConversations(r.data);
      $chatUnread.set(r.data.reduce((sum, c) => sum + c.unread, 0));
    });
  }, []);

  const appendMessage = useCallback((m: MessageDTO) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  useEffect(() => {
    loadConversations();

    const onMessage = (payload: { message: MessageDTO; with: string }) => {
      if (selectedRef.current && payload.with === selectedRef.current.userId) {
        appendMessage(payload.message);
        API.chat.markRead(payload.with).then(() => loadConversations());
        return;
      }
      loadConversations();
    };
    socket.on("message", onMessage);
    return () => {
      socket.off("message", onMessage);
    };
  }, [loadConversations, appendMessage]);

  useEffect(() => {
    return () => {
      $openChatUser.set(null);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!openUserId || openedKeyRef.current === location.key) return;
    const conv = conversations.find((c) => c.user.userId === openUserId);
    if (conv) {
      openedKeyRef.current = location.key;
      openThread(conv.user);
    }
  }, [openUserId, conversations, location.key]);

  function openThread(user: ProfilePreviewDTO) {
    setSelected(user);
    $openChatUser.set(user.userId); 
    setMessages([]);
    API.chat.history(user.userId, 30, 0).then((r) => {
      if (r.error) return toast.error(String(r.data));
      setMessages(r.data.items);
      loadConversations();
    });
  }

  function closeThread() {
    setSelected(null);
    $openChatUser.set(null);
  }

  function send() {
    const content = input.trim();
    if (!content || !selected) return;
    setInput("");
    return loadingWrapper(setSending, async () => {
      const r = await API.chat.send(selected.userId, content);
      if (r.error) return toast.error(String(r.data));
      appendMessage(r.data);
      loadConversations();
    });
  }

  if (selected) {
    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b pb-2">
          <Button variant="ghost" size="sm" onClick={closeThread}>
            ←
          </Button>
          <button
            className="relative"
            aria-label="View profile"
            onClick={() => setProfileOpen(selected.userId)}
          >
            <Avatar className="size-9">
              {selected.photo && <AvatarImage src={selected.photo} alt={selected.firstName} />}
              <AvatarFallback>{selected.firstName[0]?.toUpperCase() ?? "?"}</AvatarFallback>
            </Avatar>
            <PresenceDot
              userId={selected.userId}
              fallbackOnline={selected.online}
              className="absolute right-0 bottom-0 size-3"
            />
          </button>
          <button className="font-medium" onClick={() => setProfileOpen(selected.userId)}>
            {selected.firstName}
          </button>
        </div>

        <ProfileDialog userId={profileOpen} onClose={() => setProfileOpen(null)} />

        <div className="flex-1 space-y-2 overflow-y-auto py-3">
          {messages.map((m) => {
            const mine = m.senderId === myId;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <span
                  className={
                    "max-w-[75%] rounded-2xl px-3 py-1.5 text-sm " +
                    (mine ? "bg-primary text-primary-foreground" : "bg-muted")
                  }
                >
                  {m.content}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex shrink-0 gap-2 border-t pt-2">
          <Input
            value={input}
            placeholder="Type a message"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button disabled={sending || input.trim() === ""} onClick={send}>
            Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {conversations.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          No conversations yet. Match with someone to start chatting.
        </p>
      ) : (
        <ul className="divide-y">
          {conversations.map((c) => (
            <li key={c.user.userId}>
              <button
                className="flex w-full items-center gap-3 py-3 text-left"
                onClick={() => openThread(c.user)}
              >
                <div className="relative">
                  <Avatar className="size-11">
                    {c.user.photo && <AvatarImage src={c.user.photo} alt={c.user.firstName} />}
                    <AvatarFallback>{c.user.firstName[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                  </Avatar>
                  <PresenceDot
                    userId={c.user.userId}
                    fallbackOnline={c.user.online}
                    className="absolute right-0 bottom-0 size-3"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.user.firstName}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {c.lastMessage
                      ? (c.lastMessage.senderId === myId ? "You: " : "") + c.lastMessage.content
                      : "Say hi 👋"}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {c.unread}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
