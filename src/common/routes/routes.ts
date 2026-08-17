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
    Photos: "/api/profile/photos",
    Photo: "/api/profile/photos/:id",
    PhotoProfile: "/api/profile/photos/:id/profile",
  },
} as const;
