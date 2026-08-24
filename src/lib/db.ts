import { Pool, QueryResult, QueryResultRow } from "pg"

// Global pool instance to prevent creating multiple connections in Next.js HMR/dev
const globalForPg = global as unknown as { pgPool: Pool }

export const pool =
  globalForPg.pgPool ||
  new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "root123",
    database: process.env.PGDATABASE || "jellywatch_db",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  const res = await pool.query<T>(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV !== "production") {
    console.log("Executed query", { text, duration, rows: res.rowCount })
  }
  return res
}
