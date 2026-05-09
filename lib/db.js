import { randomUUID } from "crypto";
import { Pool } from "pg";

const globalForDb = globalThis;
const CANDLES_ROW_ID = 1;

function getPool() {
  if (!globalForDb.__luxAeternaPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is required. Set it to your PostgreSQL connection string (e.g., postgresql://USER:PASSWORD@HOST:5432/DB_NAME).",
      );
    }

    globalForDb.__luxAeternaPool = new Pool({
      connectionString,
    });
  }

  return globalForDb.__luxAeternaPool;
}

let initPromise;

async function upsertCandlesRow(pool) {
  await pool.query(
    `
      INSERT INTO candles (id, count)
      VALUES ($1, 0)
      ON CONFLICT (id) DO NOTHING;
    `,
    [CANDLES_ROW_ID],
  );
}

export async function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      const pool = getPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS candles (
          id INTEGER PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT candles_singleton CHECK (id = 1)
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS condolences (
          id TEXT PRIMARY KEY,
          name VARCHAR(80) NOT NULL,
          message VARCHAR(500) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS condolences_created_at_idx
        ON condolences (created_at);
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          name VARCHAR(80) NOT NULL,
          memory VARCHAR(1000) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS memories_created_at_idx
        ON memories (created_at);
      `);

      await upsertCandlesRow(pool);
    })();
  }

  await initPromise;
}

function mapEntry(row, textField) {
  return {
    id: row.id,
    name: row.name,
    [textField]: row[textField],
    date: row.created_at.toISOString(),
  };
}

export async function getCandlesCount() {
  await initDb();
  const pool = getPool();
  const result = await pool.query("SELECT count FROM candles WHERE id = $1;", [
    CANDLES_ROW_ID,
  ]);
  return result.rows[0]?.count ?? 0;
}

export async function lightCandle() {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE candles
      SET count = count + 1
      WHERE id = $1
      RETURNING count;
    `,
    [CANDLES_ROW_ID],
  );
  return result.rows[0].count;
}

export async function listCondolences() {
  await initDb();
  const pool = getPool();
  const result = await pool.query(`
    SELECT id, name, message, created_at
    FROM condolences
    ORDER BY created_at ASC;
  `);
  return result.rows.map((row) => mapEntry(row, "message"));
}

export async function addCondolence(name, message) {
  await initDb();
  const pool = getPool();
  const id = randomUUID();
  const result = await pool.query(
    `
      INSERT INTO condolences (id, name, message)
      VALUES ($1, $2, $3)
      RETURNING id, name, message, created_at;
    `,
    [id, name, message],
  );
  return mapEntry(result.rows[0], "message");
}

export async function listMemories() {
  await initDb();
  const pool = getPool();
  const result = await pool.query(`
    SELECT id, name, memory, created_at
    FROM memories
    ORDER BY created_at ASC;
  `);
  return result.rows.map((row) => mapEntry(row, "memory"));
}

export async function addMemory(name, memory) {
  await initDb();
  const pool = getPool();
  const id = randomUUID();
  const result = await pool.query(
    `
      INSERT INTO memories (id, name, memory)
      VALUES ($1, $2, $3)
      RETURNING id, name, memory, created_at;
    `,
    [id, name, memory],
  );
  return mapEntry(result.rows[0], "memory");
}
