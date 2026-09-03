import postgres from "postgres";

/**
 * The client is created on first query rather than at import time.
 *
 * Every page is `force-dynamic`, so `next build` never needs a database -- and
 * deferring keeps the build from failing on a fresh Vercel project whose first
 * deploy runs before the Postgres integration has been attached. A missing
 * DATABASE_URL then surfaces as a clear runtime error instead of a build crash.
 */
function connect(): postgres.Sql {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Attach a Postgres integration (Vercel: " +
        "Storage -> Connect Project) or copy .env.example to .env.local.",
    );
  }

  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  return postgres(connectionString, {
    max: 10,
    // Managed Postgres (Neon, Supabase) requires TLS; the local container has none.
    ssl: isLocal ? false : "require",
    // Managed pooled endpoints front Postgres with PgBouncer in transaction
    // mode, where named prepared statements break. Locally there is no pooler,
    // so keep them.
    prepare: isLocal,
    // Serverless platforms drop idle sockets silently; recycle before they rot.
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
    transform: postgres.camel,
  });
}

// In dev, Next reloads modules on every edit, so the pool has to hang off
// globalThis or the connection count climbs until Postgres refuses new ones.
// In production the module is evaluated once and a local is enough.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };
let pool: postgres.Sql | undefined;

function client(): postgres.Sql {
  if (process.env.NODE_ENV === "production") {
    return (pool ??= connect());
  }
  return (globalForDb.sql ??= connect());
}

/**
 * Stands in for the postgres.js client, which is both callable (as a tagged
 * template) and a bag of methods, so both traps are needed.
 */
export const sql = new Proxy(function () {} as unknown as postgres.Sql, {
  apply(_target, _thisArg, args: Parameters<postgres.Sql>) {
    return Reflect.apply(client(), undefined, args);
  },
  get(_target, property, receiver) {
    const active = client();
    const value = Reflect.get(active, property, receiver);
    return typeof value === "function" ? value.bind(active) : value;
  },
}) as postgres.Sql;
