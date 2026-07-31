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
} as const;
