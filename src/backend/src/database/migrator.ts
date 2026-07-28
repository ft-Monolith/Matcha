import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sql } from "./client";

/**
 * Runner de migrations MAISON (le sujet interdit les ORM, donc pas de migrations d'ORM).
 *
 * Principe :
 *   - les migrations sont des fichiers `.sql` numérotés dans src/backend/migrations/
 *     (0001_users.sql, 0002_tags.sql…), appliqués dans l'ORDRE alphabétique ;
 *   - une table `_migrations` mémorise celles déjà passées → le runner est IDEMPOTENT
 *     (on peut le rejouer à chaque boot sans risque) ;
 *   - chaque fichier tourne dans une TRANSACTION : s'il échoue à mi-chemin, tout est
 *     annulé, et il n'est pas marqué comme appliqué.
 *
 * Appelé une fois au démarrage (main.ts), avant de servir la moindre requête.
 */

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "migrations");

export async function runMigrations(sql: Sql): Promise<void> {
  // 1. La table qui trace les migrations déjà appliquées.
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `;

  // 2. Les fichiers .sql présents, triés (l'ordre est porté par le préfixe numérique).
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  // 3. Ce qui a déjà tourné.
  const applied = await sql<{ name: string }[]>`SELECT name FROM _migrations`;
  const alreadyApplied = new Set(applied.map((row) => row.name));

  // 4. On applique les nouveaux, dans l'ordre, chacun dans sa transaction.
  for (const file of files) {
    if (alreadyApplied.has(file)) continue;

    const content = await readFile(join(MIGRATIONS_DIR, file), "utf8");

    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO _migrations (name) VALUES (${file})`;
    });

    console.log(`[migrator] applied : ${file}`);
  }

  console.log(`[migrator] ${files.length} migration(s), ${alreadyApplied.size} déjà en base.`);
}
