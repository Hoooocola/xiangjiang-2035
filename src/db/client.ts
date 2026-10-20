import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  xiangjiangPool?: Pool;
  xiangjiangDb?: Database;
};

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  return databaseUrl;
}

export function createDatabase(databaseUrl = requireDatabaseUrl()) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: process.env.NODE_ENV === "test" ? 4 : 10,
    application_name: "xiangjiang-2035",
  });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export function getDatabase(): Database {
  if (!globalForDb.xiangjiangDb) {
    const { db, pool } = createDatabase();
    globalForDb.xiangjiangDb = db;
    globalForDb.xiangjiangPool = pool;
  }
  return globalForDb.xiangjiangDb;
}

export type AppDatabase = Database;
