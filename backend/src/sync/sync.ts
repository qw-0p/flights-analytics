import cron from 'node-cron'
import { db } from '../db.js'
import { cfg } from '../config.js'
import { fetchRows } from '../google/sheets.js'
import { parseRows, type Rec } from '../sheet/parser.js'
import { isSyncReady } from '../google/oauth.js'

let lastSync: { at: string | null; count: number; error: string | null } = {
	at: null,
	count: 0,
	error: null,
}

const COLS = [
	'uuid',
	'number',
	'time',
	'ts',
	'crew',
	'dron_type',
	'craftname',
	'result',
	'video',
	'break_dist',
	'targets',
	'day_night',
	'success',
	'raw',
]

const upsert = db.prepare(`
  INSERT INTO records (${COLS.join(',')})
  VALUES (${COLS.map(c => '@' + c).join(',')})
  ON CONFLICT(uuid) DO UPDATE SET
  ${COLS.filter(c => c !== 'uuid')
		.map(c => `${c}=excluded.${c}`)
		.join(',')}
`)

const clearRecords = db.prepare(`DELETE FROM records`)

const replaceAll = db.transaction((recs: Rec[]) => {
	clearRecords.run()
	for (const r of recs) upsert.run(r)
})

export async function runSync() {
	if (!isSyncReady()) {
		lastSync.error = 'NO_SYNC_USER'
		return lastSync
	}
	try {
		const rows = await fetchRows()
		const recs = parseRows(rows)
		console.log('[sync] fetched rows:', rows.length, 'parsed:', recs.length)
		if (rows.length && !recs.length) {
			console.log('[sync] headers row:', JSON.stringify(rows[0]))
		}
		replaceAll(recs)
		lastSync = {
			at: new Date().toISOString(),
			count: recs.length,
			error: null,
		}
	} catch (e: any) {
		lastSync.error = e?.message ?? String(e)
		console.error('[sync] failed:', lastSync.error)
	}
	return lastSync
}

export function getSyncStatus() {
	return lastSync
}

export function startSyncSchedule() {
	cron.schedule(cfg.syncCron, () => {
		runSync().then(s =>
			console.log('[sync]', s.at ?? s.error, 'records:', s.count),
		)
	})
	console.log('[sync] scheduled:', cfg.syncCron)
}
