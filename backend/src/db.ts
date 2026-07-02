import Database from "better-sqlite3";
import { cfg } from "./config.js";

export const db = new Database(cfg.dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tokens TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS records (
  uuid          TEXT PRIMARY KEY,
  ts            TEXT,            -- ISO datetime (date+time)
  date          TEXT,
  time          TEXT,
  crew          TEXT,
  dron_type     TEXT,
  target_name   TEXT,
  target_no     TEXT,
  target_id     TEXT,
  description   TEXT,
  location      TEXT,
  ammo1         TEXT,
  result        TEXT,
  issue         TEXT,
  position      TEXT,
  wounded       INTEGER DEFAULT 0,
  died          INTEGER DEFAULT 0,
  frequency     TEXT,
  coordinates   TEXT,
  inch          TEXT,
  video         TEXT,
  video_confirmed INTEGER DEFAULT 0,
  craft_name    TEXT,
  number        TEXT,
  k1            TEXT,
  -- derived
  control_type  TEXT,            -- 'fiber' | 'radio'
  day_night     TEXT,            -- 'day' | 'night'
  raw           TEXT
);
CREATE INDEX IF NOT EXISTS idx_records_ts ON records(ts);
CREATE INDEX IF NOT EXISTS idx_records_crew ON records(crew);
`);

export function saveTokens(tokens: object) {
  db.prepare(
    `INSERT INTO oauth_tokens (id, tokens, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET tokens = excluded.tokens, updated_at = excluded.updated_at`
  ).run(JSON.stringify(tokens), new Date().toISOString());
}

export function loadTokens(): any | null {
  const row = db.prepare(`SELECT tokens FROM oauth_tokens WHERE id = 1`).get() as
    | { tokens: string }
    | undefined;
  return row ? JSON.parse(row.tokens) : null;
}
