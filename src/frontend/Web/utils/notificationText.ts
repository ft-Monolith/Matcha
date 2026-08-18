import type { NotificationDTO } from "@common/dto/notification.dto";

export function notificationText(n: NotificationDTO): string {
  const name = n.actor.firstName;
  switch (n.type) {
    case "like":
      return `${name} liked you`;
    case "visit":
      return `${name} viewed your profile`;
    case "match":
      return `It's a match with ${name}!`;
    case "unlike":
      return `${name} unliked you`;
    case "message":
      return `${name} sent you a message`;
  }
}
