import * as React from "react";

import { cn } from "@shadcn/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@shadcn/ui/avatar";

function Message({
  align = "start",
  className,
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "group/message flex items-end gap-2 data-[align=end]:flex-row-reverse",
        className,
      )}
      {...props}
    />
  );
}

function MessageAvatar({
  src,
  name,
  className,
  ...props
}: React.ComponentProps<typeof Avatar> & { src?: string | null; name?: string }) {
  return (
    <Avatar data-slot="message-avatar" className={cn("size-8 shrink-0", className)} {...props}>
      {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
      <AvatarFallback className="text-xs">{name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
    </Avatar>
  );
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "bg-muted text-foreground w-fit max-w-[78%] rounded-2xl px-3.5 py-2 text-sm wrap-break-words",
        "group-data-[align=end]/message:bg-primary group-data-[align=end]/message:text-primary-foreground",
        "group-data-[align=start]/message:rounded-bl-sm group-data-[align=end]/message:rounded-br-sm",
        className,
      )}
      {...props}
    />
  );
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        "text-muted-foreground mt-1 px-1 text-[11px] group-data-[align=end]/message:text-right",
        className,
      )}
      {...props}
    />
  );
}

export { Message, MessageAvatar, MessageContent, MessageFooter };
