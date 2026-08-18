export const WebRoutes = {
  Browse: "/",
  Search: "/search",
  Chat: "/chat",
  Notifications: "/notifications",
  Profile: "/profile",

  EditProfile: "/profile/edit",
  Likes: "/likes",
  Visits: "/visits",
  Blocked: "/blocked",
  User: "/users/:id",

  VerifyEmail: "/verify-email",
  ResetPassword: "/reset-password",
} as const;

export function userPath(id: string | number): string {
  return `/users/${id}`;
}
