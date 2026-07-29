
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: Number(optional("PORT", "3000")),
  appUrl: optional("APP_URL", "http://localhost:8080"),

  databaseUrl: required("DATABASE_URL"),

  smtp: {
    host: optional("SMTP_HOST", "mailpit"),
    port: Number(optional("SMTP_PORT", "1025")),
    secure: optional("SMTP_SECURE", "false") === "true",
    user: optional("SMTP_USER", ""),
    pass: optional("SMTP_PASS", ""),
    from: optional("SMTP_FROM", "Matcha <no-reply@matcha.local>"),
  },
} as const;

export const isProd = env.nodeEnv === "production";
