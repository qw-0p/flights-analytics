import { Router } from 'express';
import { db } from '../db.js';
import { getSyncStatus, runSync } from '../sync/sync.js';
import { isSyncReady } from '../google/oauth.js';

export const apiRouter = Router();

function buildWhere(q: any): { sql: string; params: any[] } {
	const clauses: string[] = [];
	const params: any[] = [];
	const eq = (col: string, val: any) => {
		if (val !== undefined && val !== '' && val !== 'all') {
			clauses.push(`r.${col} = ?`);
			params.push(val);
		}
	};
	eq('crew', q.crew);
	eq('dron_type', q.dronType);
	eq('day_night', q.dayNight);
	eq('result', q.result);

	clauses.push(`r.dron_type LIKE '%оптоволокно%'`);
	if (q.success === '1' || q.success === '0') {
		clauses.push('r.success = ?');
		params.push(Number(q.success));
	}
	if (q.from) {
		const t = Date.parse(String(q.from));
		if (Number.isFinite(t)) {
			clauses.push('r.ts >= ?');
			params.push(t);
		}
	}
	if (q.to) {
		const t = Date.parse(String(q.to));
		if (Number.isFinite(t)) {
			clauses.push('r.ts <= ?');
			params.push(t);
		}
	}
	return {
		sql: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '',
		params,
	};
}

apiRouter.get('/filters', (_req, res) => {
	const distinct = (col: string) =>
		(
			db
				.prepare(
					`SELECT DISTINCT ${col} v FROM records WHERE ${col} <> '' ORDER BY ${col}`,
				)
				.all() as any[]
		).map(r => r.v);
	res.json({
		crew: distinct('crew'),
		dronType: distinct('dron_type'),
		result: distinct('result'),
	});
});

apiRouter.get('/summary', (req, res) => {
	const { sql, params } = buildWhere(req.query);
	const row = db
		.prepare(
			`
    SELECT
      COUNT(*) AS flights,
      SUM(CASE WHEN r.success=1 THEN 1 ELSE 0 END) AS hits,
      SUM(CASE WHEN r.success=0 THEN 1 ELSE 0 END) AS misses,
      SUM(CASE WHEN r.day_night='day'   THEN 1 ELSE 0 END) AS day,
      SUM(CASE WHEN r.day_night='night' THEN 1 ELSE 0 END) AS night,
      SUM(CASE WHEN r.success=1 AND r.day_night='day'   THEN 1 ELSE 0 END) AS hits_day,
      SUM(CASE WHEN r.success=0 AND r.day_night='day'   THEN 1 ELSE 0 END) AS misses_day,
      SUM(CASE WHEN r.success=1 AND r.day_night='night' THEN 1 ELSE 0 END) AS hits_night,
      SUM(CASE WHEN r.success=0 AND r.day_night='night' THEN 1 ELSE 0 END) AS misses_night,
      COUNT(DISTINCT r.crew) AS crews
    FROM records r ${sql}
  `,
		)
		.get(...params);
	res.json(row);
});
const DIM_COL: Record<string, { table: 'r' | 'a'; col: string }> = {
	crew: { table: 'r', col: 'crew' },
	dron_type: { table: 'r', col: 'dron_type' },
	day_night: { table: 'r', col: 'day_night' },
	success: { table: 'r', col: 'success' },
	loss_zone: { table: 'a', col: 'loss_zone' },
	reason: { table: 'a', col: 'reason' },
};

apiRouter.get('/breakdown', (req, res) => {
	const dim = DIM_COL[String(req.query.dim)];
	if (!dim) return res.status(400).json({ error: 'bad dim' });
	const { sql, params } = buildWhere(req.query);
	const ref = `${dim.table}.${dim.col}`;

	const total = (
		db
			.prepare(
				`SELECT COUNT(*) c FROM records r
				 LEFT JOIN annotations a ON a.uuid = r.uuid ${sql}`,
			)
			.get(...params) as any
	).c as number;

	const rows = db
		.prepare(
			`SELECT ${ref} AS label, COUNT(*) AS count
			 FROM records r
			 LEFT JOIN annotations a ON a.uuid = r.uuid
			 ${sql ? sql + ' AND' : 'WHERE'} ${ref} <> ''
			 GROUP BY ${ref} ORDER BY count DESC`,
		)
		.all(...params) as { label: string; count: number }[];

	res.json({
		total,
		rows: rows.map(r => ({
			...r,
			pct: total ? Math.round((r.count / total) * 1000) / 10 : 0,
		})),
	});
});

// рядки за добу + ручні поля (J/K/L)
apiRouter.get('/records', (req, res) => {
	const { sql, params } = buildWhere(req.query);
	const rows = db
		.prepare(
			`
    SELECT r.uuid, r.crew, r.position, r.number, r.time, r.day_night, r.success, r.dron_type, r.craftname, r.result, r.video, r.target,
           a.loss_zone, a.reason, COALESCE(a.reason_desc,'[]') AS reason_desc,
           COALESCE(a.break_dist,'') AS break_dist,
           COALESCE(a.note,'') AS note
    FROM records r
    LEFT JOIN annotations a ON a.uuid = r.uuid
    ${sql}
    ORDER BY r.ts
  `,
		)
		.all(...params);
	res.json(
		rows.map((r: any) => ({
			...r,
			reason_desc: JSON.parse(r.reason_desc),
			video: JSON.parse(r.video || '[]'),
		})),
	);
});

apiRouter.get('/status', (_req, res) =>
	res.json({ authed: isSyncReady(), sync: getSyncStatus() }),
);

apiRouter.post('/sync', async (_req, res) => res.json(await runSync()));
