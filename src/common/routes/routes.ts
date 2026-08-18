export const Routes = {
  Api: "/api",

  Health: "/api/health",

  Auth: {
    Base: "/api/auth",
    Register: "/api/auth/register",
    Verify: "/api/auth/verify",
    Login: "/api/auth/login",
    Refresh: "/api/auth/refresh",
    Logout: "/api/auth/logout",
    Me: "/api/auth/me",
    ForgotPassword: "/api/auth/forgot-password",
    ResetPassword: "/api/auth/reset-password",
  },

  Profile: {
    Base: "/api/profile",
    Me: "/api/profile/me",
    Update: "/api/profile",
    Account: "/api/profile/account",
    Tags: "/api/profile/tags",
    Location: "/api/profile/location",
    Onboarding: "/api/profile/onboarding",
    Photos: "/api/profile/photos",
    Photo: "/api/profile/photos/:id",
    PhotoProfile: "/api/profile/photos/:id/profile",
  },

  Profiles: {
    Base: "/api/profiles",
    List: "/api/profiles",
    ById: "/api/profiles/:id",
    Like: "/api/profiles/:id/like",
    Block: "/api/profiles/:id/block",
    Report: "/api/profiles/:id/report",
  },

  Me: {
    Base: "/api/me",
    Likers: "/api/me/likers",
    Visits: "/api/me/visits",
    Blocks: "/api/me/blocks",
  },

  Chat: {
    Base: "/api/chat",
    Conversations: "/api/chat",
    Thread: "/api/chat/:id",
    ThreadRead: "/api/chat/:id/read",
  },

  Notifications: {
    Base: "/api/notifications",
    List: "/api/notifications",
    Read: "/api/notifications/read",
    ById: "/api/notifications/:id",
  },
} as const;
