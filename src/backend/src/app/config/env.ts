/**
 * Lecture TYPÉE des variables d'environnement.
 *
 * C'est le SEUL endroit du code qui touche `process.env`. Partout ailleurs on importe
 * `env` et on a de l'autocomplétion + la garantie que la variable existe.
 *
 * Fail-fast : si une variable obligatoire manque, le process refuse de démarrer,
 * plutôt que de crasher plus tard sur un `undefined` incompréhensible.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
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

  /** La seule chose dont postgres.js a besoin (voir .env). */
  databaseUrl: required("DATABASE_URL"),
} as const;

export const isProd = env.nodeEnv === "production";
