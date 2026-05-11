import { randomUUID } from "crypto";
import { Pool } from "pg";

const globalForDb = globalThis;
const CANDLES_ROW_ID = 1;
const SITE_SETTINGS_ROW_ID = 1;

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

function toIsoDateString(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month}-${day}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

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

async function upsertSiteSettingsRow(pool) {
  await pool.query(
    `
      INSERT INTO site_settings (id, main_images, title_links)
      VALUES ($1, '[]'::jsonb, '[]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `,
    [SITE_SETTINGS_ROW_ID],
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
        ALTER TABLE condolences
        ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;
      `);
      await pool.query(`
        ALTER TABLE condolences
        ADD COLUMN IF NOT EXISTS show_on_timeline BOOLEAN NOT NULL DEFAULT FALSE;
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
        ALTER TABLE memories
        ADD COLUMN IF NOT EXISTS author VARCHAR(80);
      `);
      await pool.query(`
        ALTER TABLE memories
        ADD COLUMN IF NOT EXISTS memory_date DATE;
      `);
      await pool.query(`
        ALTER TABLE memories
        ADD COLUMN IF NOT EXISTS images JSONB;
      `);
      await pool.query(`
        ALTER TABLE memories
        ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;
      `);
      await pool.query(`
        ALTER TABLE memories
        ADD COLUMN IF NOT EXISTS show_on_timeline BOOLEAN NOT NULL DEFAULT FALSE;
      `);
      await pool.query(`
        UPDATE memories
        SET author = name
        WHERE author IS NULL;
      `);
      await pool.query(`
        UPDATE memories
        SET memory_date = created_at::DATE
        WHERE memory_date IS NULL;
      `);
      await pool.query(`
        UPDATE memories
        SET images = '[]'::jsonb
        WHERE images IS NULL;
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS memories_created_at_idx
        ON memories (created_at);
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS timeline_events (
          id TEXT PRIMARY KEY,
          year INTEGER NOT NULL,
          month INTEGER,
          day INTEGER,
          title VARCHAR(160) NOT NULL,
          description VARCHAR(1500),
          images JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_visible BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS timeline_events_date_idx
        ON timeline_events (year, month, day, created_at);
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INTEGER PRIMARY KEY,
          main_images JSONB NOT NULL DEFAULT '[]'::jsonb,
          title_links JSONB NOT NULL DEFAULT '[]'::jsonb,
          CONSTRAINT site_settings_singleton CHECK (id = 1)
        );
      `);

      await upsertCandlesRow(pool);
      await upsertSiteSettingsRow(pool);
    })();
  }

  await initPromise;
}

function mapCondolenceEntry(row) {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    visible: row.is_visible,
    showOnTimeline: row.show_on_timeline,
    date: row.created_at.toISOString(),
  };
}

function mapMemoryEntry(row) {
  return {
    id: row.id,
    author: row.author,
    memory: row.memory,
    memoryDate: toIsoDateString(row.memory_date),
    images: Array.isArray(row.images) ? row.images : [],
    visible: row.is_visible,
    showOnTimeline: row.show_on_timeline,
    date: row.created_at.toISOString(),
  };
}

function mapTimelineEventEntry(row) {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    day: row.day,
    title: row.title,
    description: row.description,
    images: Array.isArray(row.images) ? row.images : [],
    visible: row.is_visible,
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

export async function listCondolences({ includeHidden = false } = {}) {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT id, name, message, is_visible, show_on_timeline, created_at
    FROM condolences
    ${includeHidden ? "" : "WHERE is_visible = TRUE"}
    ORDER BY created_at ASC;
  `,
  );
  return result.rows.map((row) => mapCondolenceEntry(row));
}

export async function addCondolence(name, message) {
  await initDb();
  const pool = getPool();
  const id = randomUUID();
  const result = await pool.query(
    `
      INSERT INTO condolences (id, name, message)
      VALUES ($1, $2, $3)
      RETURNING id, name, message, is_visible, show_on_timeline, created_at;
    `,
    [id, name, message],
  );
  return mapCondolenceEntry(result.rows[0]);
}

export async function listMemories({ includeHidden = false } = {}) {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT id, COALESCE(author, name) AS author, memory, memory_date, COALESCE(images, '[]'::jsonb) AS images, is_visible, show_on_timeline, created_at
    FROM memories
    ${includeHidden ? "" : "WHERE is_visible = TRUE"}
    ORDER BY memory_date ASC, created_at ASC;
  `,
  );
  return result.rows.map((row) => mapMemoryEntry(row));
}

export async function addMemory(author, memory, memoryDate, images = []) {
  await initDb();
  const pool = getPool();
  const id = randomUUID();
  const result = await pool.query(
    `
      INSERT INTO memories (id, name, author, memory, memory_date, images)
      VALUES ($1, $2, $2, $3, $4, $5::jsonb)
      RETURNING id, author, memory, memory_date, COALESCE(images, '[]'::jsonb) AS images, is_visible, show_on_timeline, created_at;
    `,
    [id, author, memory, memoryDate, JSON.stringify(images)],
  );
  return mapMemoryEntry(result.rows[0]);
}

export async function setMemoryModeration(id, { visible, showOnTimeline }) {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE memories
      SET
        is_visible = COALESCE($2, is_visible),
        show_on_timeline = COALESCE($3, show_on_timeline)
      WHERE id = $1
      RETURNING id, COALESCE(author, name) AS author, memory, memory_date, COALESCE(images, '[]'::jsonb) AS images, is_visible, show_on_timeline, created_at;
    `,
    [id, visible ?? null, showOnTimeline ?? null],
  );
  return result.rows[0] ? mapMemoryEntry(result.rows[0]) : null;
}

export async function setCondolenceModeration(id, { visible, showOnTimeline }) {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE condolences
      SET
        is_visible = COALESCE($2, is_visible),
        show_on_timeline = COALESCE($3, show_on_timeline)
      WHERE id = $1
      RETURNING id, name, message, is_visible, show_on_timeline, created_at;
    `,
    [id, visible ?? null, showOnTimeline ?? null],
  );
  return result.rows[0] ? mapCondolenceEntry(result.rows[0]) : null;
}

export async function listTimelineEvents({ includeHidden = false } = {}) {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT id, year, month, day, title, description, COALESCE(images, '[]'::jsonb) AS images, is_visible, created_at
      FROM timeline_events
      ${includeHidden ? "" : "WHERE is_visible = TRUE"}
      ORDER BY year ASC, COALESCE(month, 1) ASC, COALESCE(day, 1) ASC, created_at ASC;
    `,
  );
  return result.rows.map((row) => mapTimelineEventEntry(row));
}

export async function addTimelineEvent(event) {
  await initDb();
  const pool = getPool();
  const id = randomUUID();
  const result = await pool.query(
    `
      INSERT INTO timeline_events (id, year, month, day, title, description, images, is_visible)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, TRUE)
      RETURNING id, year, month, day, title, description, COALESCE(images, '[]'::jsonb) AS images, is_visible;
    `,
    [
      id,
      event.year,
      event.month ?? null,
      event.day ?? null,
      event.title,
      event.description ?? null,
      JSON.stringify(event.images ?? []),
    ],
  );
  return mapTimelineEventEntry(result.rows[0]);
}

export async function updateTimelineEvent(id, event) {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE timeline_events
      SET
        year = COALESCE($2, year),
        month = $3,
        day = $4,
        title = COALESCE($5, title),
        description = $6,
        images = COALESCE($7::jsonb, images),
        is_visible = COALESCE($8, is_visible)
      WHERE id = $1
      RETURNING id, year, month, day, title, description, COALESCE(images, '[]'::jsonb) AS images, is_visible;
    `,
    [
      id,
      event.year ?? null,
      event.month ?? null,
      event.day ?? null,
      event.title ?? null,
      event.description ?? null,
      event.images ? JSON.stringify(event.images) : null,
      event.visible ?? null,
    ],
  );
  return result.rows[0] ? mapTimelineEventEntry(result.rows[0]) : null;
}

export async function deleteTimelineEvent(id) {
  await initDb();
  const pool = getPool();
  const result = await pool.query("DELETE FROM timeline_events WHERE id = $1;", [id]);
  return result.rowCount > 0;
}

export async function getSiteSettings() {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT main_images, title_links
      FROM site_settings
      WHERE id = $1;
    `,
    [SITE_SETTINGS_ROW_ID],
  );
  const row = result.rows[0] ?? { main_images: [], title_links: [] };
  return {
    mainImages: Array.isArray(row.main_images) ? row.main_images : [],
    titleLinks: Array.isArray(row.title_links) ? row.title_links : [],
  };
}

export async function updateSiteSettings({ mainImages, titleLinks }) {
  await initDb();
  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE site_settings
      SET
        main_images = COALESCE($2::jsonb, main_images),
        title_links = COALESCE($3::jsonb, title_links)
      WHERE id = $1
      RETURNING main_images, title_links;
    `,
    [
      SITE_SETTINGS_ROW_ID,
      mainImages ? JSON.stringify(mainImages) : null,
      titleLinks ? JSON.stringify(titleLinks) : null,
    ],
  );
  const row = result.rows[0];
  return {
    mainImages: Array.isArray(row.main_images) ? row.main_images : [],
    titleLinks: Array.isArray(row.title_links) ? row.title_links : [],
  };
}
