import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sql } from "./client";



const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "migrations",
);

export async function runMigrations(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = await sql<{ name: string }[]>`SELECT name FROM _migrations`;
  const alreadyApplied = new Set(applied.map((row) => row.name));

  for (const file of files) {
    if (alreadyApplied.has(file)) continue;

    const content = await readFile(join(MIGRATIONS_DIR, file), "utf8");

    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO _migrations (name) VALUES (${file})`;
    });

    console.log(`[migrator] applied : ${file}`);
  }

  console.log(
    `[migrator] ${files.length} migration(s), ${alreadyApplied.size} déjà en base.`,
  );
}
