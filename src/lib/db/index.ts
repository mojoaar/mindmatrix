import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: any;
};

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    max: process.env.DB_MAX_CONNECTIONS
      ? parseInt(process.env.DB_MAX_CONNECTIONS)
      : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

const localDb = drizzle(conn, { schema });
export const db = (globalForDb.db ?? localDb) as typeof localDb;

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export const sql = conn;
export type DbClient = typeof db;
export * from "./schema";
