import { config } from "dotenv";
import { createDatabase } from "./client";
import { seedDevelopmentData } from "./seed-data";

config({ path: ".env.local", quiet: true });
config({ path: ".env", override: false, quiet: true });

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed is disabled in production");
  }
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Set ALLOW_DEMO_SEED=true to run the explicit development seed");
  }

  const { db, pool } = createDatabase();
  try {
    await seedDevelopmentData(db);
    console.info(
      JSON.stringify({ event: "database.seeded", dataClass: "DEMO_DEVELOPMENT", status: "ok" }),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({ event: "database.seed_failed", message: String(error) }));
  process.exitCode = 1;
});
