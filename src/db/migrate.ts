import { config } from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase } from "./client";

config({ path: ".env.local", quiet: true });
config({ path: ".env", override: false, quiet: true });

async function main() {
  const { db, pool } = createDatabase();
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.info(JSON.stringify({ event: "database.migrated", status: "ok" }));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({ event: "database.migration_failed", message: String(error) }));
  process.exitCode = 1;
});
