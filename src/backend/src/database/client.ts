import postgres from "postgres";
import { env } from "../app/config/env";

export type Sql = ReturnType<typeof postgres>;

export function createSqlClient(): Sql {
  return postgres(env.databaseUrl, {
    max: 10, 
    onnotice: () => {},
  });
}
