import Database from 'better-sqlite3'
import { cfg } from './config.js'

export const db = new Database(cfg.dbPath)
db.pragma('journal_mode = WAL')

export const RECORD_COLS = [
	'uuid',
	'number',
	'time',
	'ts',
	'crew',
	'position',
	'dron_type',
	'craftname',
	'result',
	'video',
	'target',
	'break_dist',
	'day_night',
	'success',
	'raw',
]

db.exec(`
CREATE TABLE IF NOT EXISTS records (
  ${RECORD_COLS.map(c => (c === 'uuid' ? 'uuid TEXT PRIMARY KEY' : `${c} TEXT`)).join(',\n  ')}
);
CREATE INDEX IF NOT EXISTS idx_records_crew ON records(crew);
CREATE INDEX IF NOT EXISTS idx_records_ts ON records(ts);

CREATE TABLE IF NOT EXISTS annotations (
  uuid        TEXT PRIMARY KEY,
  loss_zone   TEXT,            -- J (ручне перевизначення)
  reason      TEXT,            -- K
  reason_desc TEXT,            -- L (JSON-масив)
  updated_at  TEXT
);
`)

function ensureColumn(table: string, name: string, decl: string) {
	const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[]
	if (!cols.some(c => c.name === name)) {
		db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${decl}`)
	}
}
ensureColumn('records', 'break_dist', 'TEXT')
ensureColumn('records', 'video', 'TEXT')
ensureColumn('records', 'day_night', 'TEXT')
ensureColumn('records', 'success', 'INTEGER')
ensureColumn('records', 'raw', 'TEXT')
ensureColumn('records', 'ts', 'INTEGER')
ensureColumn('records', 'craftname', 'TEXT')
ensureColumn('annotations', 'break_dist', 'TEXT')
ensureColumn('annotations', 'note', 'TEXT')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  email        TEXT PRIMARY KEY,
  tokens       TEXT NOT NULL,        -- JSON google tokens (з refresh_token)
  sheet_access INTEGER DEFAULT 0,    -- 1 якщо читає таблицю
  updated_at   TEXT NOT NULL
);
`)

export function saveUser(email: string, tokens: object, sheetAccess: boolean) {
	const existing = loadUser(email)
	const merged = { ...(existing?.tokens ?? {}), ...tokens } // не губимо refresh_token
	db.prepare(
		`INSERT INTO users (email, tokens, sheet_access, updated_at)
     VALUES (@email,@tokens,@sheet_access,@updated_at)
     ON CONFLICT(email) DO UPDATE SET
       tokens=excluded.tokens, sheet_access=excluded.sheet_access, updated_at=excluded.updated_at`,
	).run({
		email,
		tokens: JSON.stringify(merged),
		sheet_access: sheetAccess ? 1 : 0,
		updated_at: new Date().toISOString(),
	})
}

export function loadUser(
	email: string,
): { email: string; tokens: any; sheet_access: number } | null {
	const row = db
		.prepare(`SELECT email, tokens, sheet_access FROM users WHERE email=?`)
		.get(email) as any
	return row ? { ...row, tokens: JSON.parse(row.tokens) } : null
}

// будь-який дозволений юзер із refresh_token — для фонового sync
export function anySyncUser(): { email: string; tokens: any } | null {
	const row = db
		.prepare(
			`SELECT email, tokens FROM users WHERE sheet_access=1 ORDER BY updated_at DESC`,
		)
		.all() as any[]
	for (const r of row) {
		const t = JSON.parse(r.tokens)
		if (t?.refresh_token) return { email: r.email, tokens: t }
	}
	return null
}

export function getSetting<T = string>(key: string): T | null {
	const row = db.prepare(`SELECT value FROM settings WHERE key=?`).get(key) as
		| { value: string }
		| undefined
	if (row?.value == null) return null
	try {
		return JSON.parse(row.value) as T
	} catch {
		return row.value as unknown as T
	}
}

export function setSetting(key: string, value: unknown): void {
	const v = typeof value === 'string' ? value : JSON.stringify(value)
	db.prepare(
		`INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
	).run(key, v)
}
