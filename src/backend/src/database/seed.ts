import { PREDEFINED_TAGS } from "@common/constant/tags";
import type { Sql } from "./client";

export async function seedTags(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO tags (name)
    SELECT unnest(${PREDEFINED_TAGS as unknown as string[]}::citext[])
    ON CONFLICT (name) DO NOTHING
  `;
  console.log(
    `[seed] ${PREDEFINED_TAGS.length} tag(s) prédéfini(s) assurés en base.`,
  );
}
