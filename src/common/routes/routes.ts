export const Routes = {
  Api: "/api",

  Health: "/api/health",

  Auth: {
    Base: "/api/auth",
    Register: "/api/auth/register",
    Verify: "/api/auth/verify",
  },
} as const;
