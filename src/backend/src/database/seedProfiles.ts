import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import argon2 from "argon2";
import { SEXUAL_PREFS } from "@common/constant/profile";
import { env } from "../app/config/env";
import { createSqlClient, type Sql } from "./client";

const SEED_EMAIL_DOMAIN = "seed.matcha.local";
const SEED_PASSWORD = "Password1!";
const CONCURRENCY = 15;

const AURA_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "Lyon", lat: 45.758, lon: 4.835 },
  { name: "Villeurbanne", lat: 45.766, lon: 4.879 },
  { name: "Écully", lat: 45.774, lon: 4.779 },
  { name: "Charbonnières-les-Bains", lat: 45.784, lon: 4.751 },
  { name: "Tassin-la-Demi-Lune", lat: 45.762, lon: 4.788 },
  { name: "Caluire-et-Cuire", lat: 45.795, lon: 4.844 },
  { name: "Bron", lat: 45.742, lon: 4.912 },
  { name: "Vénissieux", lat: 45.697, lon: 4.887 },
  { name: "Oullins", lat: 45.714, lon: 4.807 },
  { name: "Villefranche-sur-Saône", lat: 45.989, lon: 4.719 },
  { name: "Vienne", lat: 45.525, lon: 4.874 },
  { name: "Saint-Étienne", lat: 45.439, lon: 4.387 },
  { name: "Grenoble", lat: 45.188, lon: 5.724 },
  { name: "Chambéry", lat: 45.564, lon: 5.917 },
  { name: "Annecy", lat: 45.899, lon: 6.129 },
  { name: "Valence", lat: 44.933, lon: 4.892 },
  { name: "Clermont-Ferrand", lat: 45.777, lon: 3.087 },
  { name: "Bourg-en-Bresse", lat: 46.205, lon: 5.226 },
  { name: "Aix-les-Bains", lat: 45.688, lon: 5.915 },
  { name: "Romans-sur-Isère", lat: 45.045, lon: 5.05 },
];

function randomAuraLocation(): {
  city: string;
  latitude: number;
  longitude: number;
} {
  const c = pick(AURA_CITIES);
  return {
    city: c.name,
    latitude: c.lat + (Math.random() - 0.5) * 0.04,
    longitude: c.lon + (Math.random() - 0.5) * 0.04,
  };
}

const LAST_SEEN_MAX_DAYS = 21;

function randomLastSeen(): Date {
  const ms = Math.random() * LAST_SEEN_MAX_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

const BIOS = [
  "Coffee lover, weekend hiker and amateur cook.",
  "Just here to meet interesting people.",
  "Music, movies and long walks.",
  "Passionate about travel and photography.",
  "Dog person. Always up for an adventure.",
  "Foodie looking for someone to share plates with.",
  "Bookworm by night, runner by morning.",
  "Let's grab a drink and see where it goes.",
  "Into fitness, nature and good conversations.",
  "Curious mind, always learning something new.",
];

interface RandomUser {
  gender: "male" | "female";
  name: { first: string; last: string };
  login: { username: string };
  dob: { date: string };
  location: {
    city: string;
    coordinates: { latitude: string; longitude: string };
  };
  picture: { large: string };
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample<T>(arr: readonly T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function usernameFrom(login: string, index: number): string {
  const base = login.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 12) || "user";
  return `${base}_${index}`.slice(0, 20);
}

async function fetchRandomUsers(count: number): Promise<RandomUser[]> {
  const url = `https://randomuser.me/api/?results=${count}&nat=us,gb,fr,es,de,ca,au,br&inc=gender,name,login,dob,location,picture`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`randomuser.me responded ${res.status}`);
  const body = (await res.json()) as { results: RandomUser[] };
  return body.results;
}

async function downloadPhoto(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `${randomUUID()}.jpg`;
    await writeFile(join(env.uploadsDir, filename), buffer);
    return filename;
  } catch {
    return null;
  }
}

async function seedOne(
  sql: Sql,
  passwordHash: string,
  tagIds: string[],
  u: RandomUser,
  index: number,
): Promise<void> {
  const email =
    `${index}.${u.login.username}@${SEED_EMAIL_DOMAIN}`.toLowerCase();
  const username = usernameFrom(u.login.username, index);
  const gender = u.gender === "male" ? "man" : "woman";

  const [user] = await sql<{ id: string }[]>`
    INSERT INTO users (email, username, last_name, first_name, password_hash, email_verified, onboarded, last_seen)
    VALUES (${email}, ${username}, ${u.name.last}, ${u.name.first}, ${passwordHash}, true, true, ${randomLastSeen()})
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  if (!user) return;

  const loc = randomAuraLocation();
  await sql`
    INSERT INTO profiles (user_id, gender, sexual_pref, biography, birthdate, latitude, longitude, city, location_consent)
    VALUES (
      ${user.id}, ${gender}, ${pick(SEXUAL_PREFS)}, ${pick(BIOS)},
      ${u.dob.date.slice(0, 10)},
      ${loc.latitude}, ${loc.longitude},
      ${loc.city}, true
    )
  `;

  const picked = sample(tagIds, 2, 5);
  if (picked.length > 0) {
    await sql`
      INSERT INTO user_tags ${sql(picked.map((tagId) => ({ user_id: user.id, tag_id: tagId })))}
    `;
  }

  const filename = await downloadPhoto(u.picture.large);
  if (filename) {
    await sql`
      INSERT INTO pictures (user_id, filename, is_profile, position)
      VALUES (${user.id}, ${filename}, true, 0)
    `;
  }
}

async function runPool<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await worker(items[i]);
    }
  });
  await Promise.all(runners);
}

async function relocate(sql: Sql): Promise<void> {
  const rows = await sql<{ user_id: string }[]>`
    SELECT p.user_id
    FROM profiles p JOIN users u ON u.id = p.user_id
    WHERE u.email LIKE ${"%@" + SEED_EMAIL_DOMAIN}
  `;
  console.log(`[seed] relocalisation de ${rows.length} profils en AURA…`);
  await runPool(rows, async ({ user_id }) => {
    const loc = randomAuraLocation();
    await sql`
      UPDATE profiles
      SET latitude = ${loc.latitude}, longitude = ${loc.longitude}, city = ${loc.city}
      WHERE user_id = ${user_id}
    `;
  });
  console.log("[seed] relocation over.");
}

async function main() {
  const arg = process.argv[2];
  const sql = createSqlClient();

  if (arg === "relocate") {
    try {
      await relocate(sql);
    } finally {
      await sql.end();
    }
    return;
  }

  const target = Number(arg ?? "500");

  try {
    const [{ count }] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM users WHERE email LIKE ${"%@" + SEED_EMAIL_DOMAIN}
    `;
    const toCreate = target - count;
    if (toCreate <= 0) {
      console.log(
        `[seed] ${count} profiles created`,
      );
      return;
    }
    console.log(
      `[seed] profile to ${toCreate} ${target} ${count})…`,
    );

    const passwordHash = await argon2.hash(SEED_PASSWORD);
    const tags = await sql<{ id: string }[]>`SELECT id FROM tags`;
    const tagIds = tags.map((t) => t.id);
    if (tagIds.length === 0)
      throw new Error("tags table is empty, run seedTags() first");

    const users = await fetchRandomUsers(toCreate);

    let done = 0;
    await runPool(
      users.map((u, i) => ({ u, i: count + i })),
      async ({ u, i }) => {
        await seedOne(sql, passwordHash, tagIds, u, i);
        done++;
        if (done % 50 === 0) console.log(`[seed] ${done}/${users.length}…`);
      },
    );

    console.log(
      `[seed] over ${done} profiles created`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("[seed] échec:", err);
  process.exit(1);
});
