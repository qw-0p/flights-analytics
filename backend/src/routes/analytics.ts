import { Router } from 'express';
import { db } from '../db.js';
import { getSyncStatus, runSync } from '../sync/sync.js';
import { isSyncReady } from '../google/oauth.js';

export const apiRouter = Router();

const KYIV_OFFSET = 3 * 3600 * 1000;
const dayKey = (ts: number) => {
	const shifted = ts + KYIV_OFFSET - 19 * 3600 * 1000;
	const d = new Date(shifted);
	return d.toISOString().slice(0, 10);
};

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
	const distinctDron = () =>
		(
			db
				.prepare(
					`SELECT DISTINCT dron_type v FROM records
					 WHERE dron_type LIKE '%оптоволокно%' ORDER BY dron_type`,
				)
				.all() as any[]
		).map(r => r.v);
	res.json({
		crew: distinct('crew'),
		dronType: distinctDron(),
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
	craftname: { table: 'r', col: 'craftname' },
	dron_type: { table: 'r', col: 'dron_type' },
	day_night: { table: 'r', col: 'day_night' },
	success: { table: 'r', col: 'success' },
	loss_zone: { table: 'a', col: 'loss_zone' },
	reason: { table: 'a', col: 'reason' },
	result: { table: 'r', col: 'result' },
};

apiRouter.get('/breakdown', (req, res) => {
	const dim = DIM_COL[String(req.query.dim)];
	if (!dim) return res.status(400).json({ error: 'bad dim' });
	const { sql, params } = buildWhere(req.query);
	const ref = `${dim.table}.${dim.col}`;

	const exclude = String(req.query.exclude ?? '')
		.split('|')
		.filter(Boolean);
	const exSql = exclude.length
		? ` AND ${ref} NOT IN (${exclude.map(() => '?').join(',')})`
		: '';

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
			 ${sql ? sql + ' AND' : 'WHERE'} ${ref} <> ''${exSql}
			 GROUP BY ${ref} ORDER BY count DESC`,
		)
		.all(...params, ...exclude) as { label: string; count: number }[];

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
			loss_zone: r.loss_zone || (Number(r.success) === 1 ? r.result : ''),
			reason_desc: JSON.parse(r.reason_desc),
			video: JSON.parse(r.video || '[]'),
		})),
	);
});

apiRouter.get('/pivot', (req, res) => {
	const { sql, params } = buildWhere(req.query);
	const rows = db
		.prepare(
			`SELECT r.ts, r.success, r.day_night, r.result,
			        a.loss_zone, a.reason, a.reason_desc
			 FROM records r
			 LEFT JOIN annotations a ON a.uuid = r.uuid
			 ${sql} ORDER BY r.ts`,
		)
		.all(...params) as any[];

	const results = new Set<string>();
	const zones = new Set<string>();
	const reasons = new Set<string>();
	const descs = new Set<string>();
	const days = new Map<string, any>();

	for (const r of rows) {
		if (r.ts == null) continue;
		const k = dayKey(Number(r.ts));
		let d = days.get(k);
		if (!d) {
			d = {
				day: k,
				flights: 0,
				hits: 0,
				misses: 0,
				day_c: 0,
				night_c: 0,
				hits_day: 0,
				misses_day: 0,
				hits_night: 0,
				misses_night: 0,
				result: {},
				zone: {},
				reason: {},
				desc: {},
			};
			days.set(k, d);
		}
		const night = r.day_night === 'night';
		d.flights++;
		if (Number(r.success) === 1) {
			d.hits++;
			night ? d.hits_night++ : d.hits_day++;
		} else {
			d.misses++;
			night ? d.misses_night++ : d.misses_day++;
		}
		night ? d.night_c++ : d.day_c++;
		if (r.result) {
			results.add(r.result);
			d.result[r.result] = (d.result[r.result] || 0) + 1;
		}
		if (r.loss_zone) {
			zones.add(r.loss_zone);
			d.zone[r.loss_zone] = (d.zone[r.loss_zone] || 0) + 1;
		}
		if (r.reason) {
			reasons.add(r.reason);
			d.reason[r.reason] = (d.reason[r.reason] || 0) + 1;
		}
		try {
			for (const x of JSON.parse(r.reason_desc || '[]')) {
				descs.add(x);
				d.desc[x] = (d.desc[x] || 0) + 1;
			}
		} catch {}
	}

	const colors = db.prepare(`SELECT day, metric, color FROM cell_colors`).all();

	res.json({
		results: [...results],
		zones: [...zones],
		reasons: [...reasons],
		descs: [...descs],
		days: [...days.values()].sort((a, b) => (a.day < b.day ? 1 : -1)),
		colors,
	});
});

apiRouter.put('/pivot/color', (req, res) => {
	const { day, metric, color } = req.body ?? {};
	if (!day || !metric) return res.status(400).json({ error: 'bad' });
	if (!color) {
		db.prepare(`DELETE FROM cell_colors WHERE day=? AND metric=?`).run(
			day,
			metric,
		);
	} else {
		db.prepare(
			`INSERT INTO cell_colors (day, metric, color) VALUES (?,?,?)
			 ON CONFLICT(day, metric) DO UPDATE SET color=excluded.color`,
		).run(day, metric, color);
	}
	res.json({ ok: true });
});

apiRouter.get('/breakdown-desc', (req, res) => {
	const { sql, params } = buildWhere(req.query);
	const exclude = String(req.query.exclude ?? '')
		.split('|')
		.filter(Boolean);

	const rows = db
		.prepare(
			`SELECT a.reason_desc AS d FROM records r
			 LEFT JOIN annotations a ON a.uuid = r.uuid
			 ${sql ? sql + ' AND' : 'WHERE'} a.reason_desc <> '' AND a.reason_desc <> '[]'`,
		)
		.all(...params) as { d: string }[];

	const total = (
		db.prepare(`SELECT COUNT(*) c FROM records r ${sql}`).get(...params) as any
	).c as number;

	const counts = new Map<string, number>();
	for (const { d } of rows) {
		try {
			for (const x of JSON.parse(d)) {
				if (exclude.includes(x)) continue;
				counts.set(x, (counts.get(x) || 0) + 1);
			}
		} catch {}
	}

	res.json({
		total,
		rows: [...counts.entries()]
			.map(([label, count]) => ({
				label,
				count,
				pct: total ? Math.round((count / total) * 1000) / 10 : 0,
			}))
			.sort((a, b) => b.count - a.count),
	});
});

apiRouter.get('/status', (_req, res) =>
	res.json({ authed: isSyncReady(), sync: getSyncStatus() }),
);

apiRouter.post('/sync', async (_req, res) => res.json(await runSync()));
