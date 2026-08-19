import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { ConversationDTO, MessageDTO } from "@common/dto/chat.dto";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import {
  $user,
  $chatUnread,
  $openChatUser,
  $use,
} from "@web/observables/observables";
import { socket } from "@web/realtime/socket";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { ChevronLeft, Send, MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@shadcn/ui/avatar";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";
import { PresenceDot, PresenceText } from "@web/component/PresenceIndicator";
import { ProfileDialog } from "@web/component/ProfileDialog";
import { Message, MessageAvatar, MessageContent } from "@shadcn/ui/message";
import { cn } from "@shadcn/lib/utils";

const HISTORY_PAGE = 30;

function formatShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export function ChatView() {
  const me = $use($user);
  const myId = me?.id ?? "";
  const location = useLocation();
  const openUserId = (location.state as { openUserId?: string } | null)
    ?.openUserId;
  const openedKeyRef = useRef<string | null>(null);

  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [selected, setSelected] = useState<ProfilePreviewDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [profileOpen, setProfileOpen] = useState<string | null>(null); // profil ouvert au clic sur l'avatar
  const [histOffset, setHistOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef(0);
  const stickBottomRef = useRef(true);
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
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      stickBottomRef.current = true;
      return [...prev, m];
    });
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
    const el = scrollRef.current;
    if (!el) return;
    if (stickBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      stickBottomRef.current = true;
    }
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
    setHistOffset(0);
    setHasMore(false);
    stickBottomRef.current = true;
    API.chat.history(user.userId, HISTORY_PAGE, 0).then((r) => {
      if (r.error) return toast.error(String(r.data));
      setMessages(r.data.items);
      setHistOffset(r.data.items.length);
      setHasMore(r.data.hasNextPage);
      loadConversations();
    });
  }

  function loadOlder() {
    if (!selected || loadingMore || !hasMore) return;
    prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0;
    stickBottomRef.current = false;
    setLoadingMore(true);
    API.chat.history(selected.userId, HISTORY_PAGE, histOffset).then((r) => {
      setLoadingMore(false);
      if (r.error) return;
      setMessages((prev) => {
        const existing = new Set(prev.map((x) => x.id));
        const older = r.data.items.filter((x) => !existing.has(x.id));
        return [...older, ...prev];
      });
      setHistOffset((o) => o + r.data.items.length);
      setHasMore(r.data.hasNextPage);
    });
  }

  function onScroll() {
    const el = scrollRef.current;
    if (el && el.scrollTop < 60 && hasMore && !loadingMore) loadOlder();
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={closeThread}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <button
            className="relative shrink-0"
            aria-label="View profile"
            onClick={() => setProfileOpen(selected.userId)}
          >
            <Avatar className="size-10">
              {selected.photo && (
                <AvatarImage src={selected.photo} alt={selected.firstName} />
              )}
              <AvatarFallback>
                {selected.firstName[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <PresenceDot
              userId={selected.userId}
              fallbackOnline={selected.online}
              className="absolute right-0 bottom-0 size-3"
            />
          </button>
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => setProfileOpen(selected.userId)}
          >
            <p className="truncate font-semibold leading-tight">
              {selected.firstName}
            </p>
            <PresenceText
              userId={selected.userId}
              fallbackOnline={selected.online}
            />
          </button>
        </div>

        <ProfileDialog
          userId={profileOpen}
          onClose={() => setProfileOpen(null)}
        />

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain py-3 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {loadingMore && (
            <p className="text-muted-foreground py-1 text-center text-xs">
              Loading…
            </p>
          )}
          {messages.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Say hi to {selected.firstName} 👋
            </p>
          ) : (
            messages.map((m, i) => {
              const mine = m.senderId === myId;
              const prev = messages[i - 1];
              const startOfRun = !prev || prev.senderId !== m.senderId;
              return (
                <Message
                  key={m.id}
                  align={mine ? "end" : "start"}
                  className={startOfRun ? "mt-3 first:mt-0" : ""}
                >
                  {!mine &&
                    (startOfRun ? (
                      <MessageAvatar
                        src={selected.photo}
                        name={selected.firstName}
                      />
                    ) : (
                      <div className="size-8 shrink-0" />
                    ))}
                  <MessageContent>{m.content}</MessageContent>
                </Message>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t pt-2">
          <Input
            value={input}
            placeholder="Type a message"
            maxLength={1000}
            className="rounded-full"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button
            size="icon"
            aria-label="Send"
            className="shrink-0 rounded-full"
            disabled={sending || input.trim() === ""}
            onClick={send}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <h1 className="px-2 text-lg font-semibold">Messages</h1>
      {conversations.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 py-16 text-center">
          <MessagesSquare className="size-10 opacity-40" />
          <p className="text-sm">
            No conversations yet.
            <br />
            Match with someone to start chatting.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {conversations.map((c) => {
            const unread = c.unread > 0;
            return (
              <li key={c.user.userId}>
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => openThread(c.user)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-12">
                      {c.user.photo && (
                        <AvatarImage
                          src={c.user.photo}
                          alt={c.user.firstName}
                        />
                      )}
                      <AvatarFallback>
                        {c.user.firstName[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <PresenceDot
                      userId={c.user.userId}
                      fallbackOnline={c.user.online}
                      className="absolute right-0 bottom-0 size-3"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          "truncate font-medium",
                          unread && "font-semibold",
                        )}
                      >
                        {c.user.firstName}
                      </p>
                      {c.lastMessage && (
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {formatShort(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-sm",
                          unread
                            ? "text-foreground font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {c.lastMessage
                          ? (c.lastMessage.senderId === myId ? "You: " : "") +
                            c.lastMessage.content
                          : "Say hi 👋"}
                      </p>
                      {unread && (
                        <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
