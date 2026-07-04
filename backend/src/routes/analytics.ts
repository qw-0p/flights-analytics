import { Router } from 'express'
import { db } from '../db.js'
import { getSyncStatus, runSync } from '../sync/sync.js'
import { isSyncReady } from '../google/oauth.js'

export const apiRouter = Router()

function buildWhere(q: any): { sql: string; params: any[] } {
	const clauses: string[] = []
	const params: any[] = []
	const eq = (col: string, val: any) => {
		if (val !== undefined && val !== '' && val !== 'all') {
			clauses.push(`r.${col} = ?`)
			params.push(val)
		}
	}
	eq('crew', q.crew)
	eq('dron_type', q.dronType)
	eq('day_night', q.dayNight)
	eq('result', q.result)
	if (q.success === '1' || q.success === '0') {
		clauses.push('r.success = ?')
		params.push(Number(q.success))
	}
	if (q.from) {
		const t = Date.parse(String(q.from))
		if (Number.isFinite(t)) {
			clauses.push('r.ts >= ?')
			params.push(t)
		}
	}
	if (q.to) {
		const t = Date.parse(String(q.to))
		if (Number.isFinite(t)) {
			clauses.push('r.ts <= ?')
			params.push(t)
		}
	}
	return {
		sql: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '',
		params,
	}
}

apiRouter.get('/filters', (_req, res) => {
	const distinct = (col: string) =>
		(
			db
				.prepare(
					`SELECT DISTINCT ${col} v FROM records WHERE ${col} <> '' ORDER BY ${col}`,
				)
				.all() as any[]
		).map(r => r.v)
	res.json({
		crew: distinct('crew'),
		dronType: distinct('dron_type'),
		result: distinct('result'),
	})
})

apiRouter.get('/summary', (req, res) => {
	const { sql, params } = buildWhere(req.query)
	const row = db
		.prepare(
			`
    SELECT
      COUNT(*)                          AS flights,
      COALESCE(SUM(a.targets),0)        AS targets,
      SUM(CASE WHEN r.success=1 THEN 1 ELSE 0 END) AS hits,
      SUM(CASE WHEN r.success=0 THEN 1 ELSE 0 END) AS misses,
      SUM(CASE WHEN r.day_night='day'   THEN 1 ELSE 0 END) AS day,
      SUM(CASE WHEN r.day_night='night' THEN 1 ELSE 0 END) AS night,
      COUNT(DISTINCT r.crew)            AS crews
    FROM records r
    LEFT JOIN annotations a ON a.uuid = r.uuid
    ${sql}
  `,
		)
		.get(...params)
	res.json(row)
})

const DIMS: Record<string, string> = {
	crew: 'crew',
	result: 'result',
	dronType: 'dron_type',
	dayNight: 'day_night',
}
apiRouter.get('/breakdown', (req, res) => {
	const col = DIMS[String(req.query.dim)]
	if (!col) return res.status(400).json({ error: 'bad dim' })
	const { sql, params } = buildWhere(req.query)
	const rows = db
		.prepare(
			`
    SELECT r.${col} AS label, COUNT(*) AS value,
           COALESCE(SUM(a.targets),0) AS targets,
           SUM(CASE WHEN r.success=1 THEN 1 ELSE 0 END) AS hits
    FROM records r
    LEFT JOIN annotations a ON a.uuid = r.uuid
    ${sql}
    ${sql ? 'AND' : 'WHERE'} r.${col} <> ''
    GROUP BY r.${col} ORDER BY value DESC LIMIT 50
  `,
		)
		.all(...params)
	res.json(rows)
})

// рядки за добу + ручні поля (J/K/L)
apiRouter.get('/records', (req, res) => {
	const { sql, params } = buildWhere(req.query)
	const rows = db
		.prepare(
			`
    SELECT r.uuid, r.crew, r.number, r.time, r.day_night, r.success, r.dron_type, r.craftname, r.result, r.video, r.target,
           a.loss_zone, a.reason, COALESCE(a.reason_desc,'[]') AS reason_desc,
           COALESCE(a.break_dist,'') AS break_dist,
           COALESCE(a.note,'') AS note,
           COALESCE(a.targets,0) AS targets
    FROM records r
    LEFT JOIN annotations a ON a.uuid = r.uuid
    ${sql}
    ORDER BY r.ts
  `,
		)
		.all(...params)
	res.json(
		rows.map((r: any) => ({
			...r,
			reason_desc: JSON.parse(r.reason_desc),
			video: JSON.parse(r.video || '[]'),
		})),
	)
})

apiRouter.get('/status', (_req, res) =>
	res.json({ authed: isSyncReady(), sync: getSyncStatus() }),
)

apiRouter.post('/sync', async (_req, res) => res.json(await runSync()))
