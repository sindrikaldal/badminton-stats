import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

// Next dev reloads modules on every edit; without this the pool count climbs
// until Postgres refuses new connections.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(connectionString, {
    max: 10,
    // Managed Postgres (Neon, Supabase) requires TLS; the local container has none.
    ssl: isLocal ? false : "require",
    // Serverless platforms drop idle sockets silently; recycle before they rot.
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
    transform: postgres.camel,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
