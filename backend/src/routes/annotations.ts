import { Router } from 'express';
import { db } from '../db.js';

export const annRouter = Router();

// upsert ручних полів по запису
annRouter.put('/:uuid', (req, res) => {
	const { loss_zone = '', reason = '', reason_desc = [] } = req.body ?? {};
	db.prepare(
		`
    INSERT INTO annotations (uuid, loss_zone, reason, reason_desc, updated_at)
    VALUES (@uuid,@loss_zone,@reason,@reason_desc,@updated_at)
    ON CONFLICT(uuid) DO UPDATE SET
      loss_zone=excluded.loss_zone, reason=excluded.reason,
      reason_desc=excluded.reason_desc, updated_at=excluded.updated_at
  `,
	).run({
		uuid: req.params.uuid,
		loss_zone,
		reason,
		reason_desc: JSON.stringify(reason_desc),
		updated_at: new Date().toISOString(),
	});
	res.json({ ok: true });
});

// значення для селектів (раніше введені)
annRouter.get('/options', (_req, res) => {
	const distinct = (col: string) =>
		(
			db
				.prepare(
					`SELECT DISTINCT ${col} v FROM annotations WHERE ${col}<>'' ORDER BY ${col}`,
				)
				.all() as any[]
		).map(r => r.v);
	const descs = new Set<string>();
	for (const r of db
		.prepare(`SELECT reason_desc d FROM annotations WHERE d<>'' AND d<>'[]'`)
		.all() as any[]) {
		try {
			JSON.parse(r.d).forEach((x: string) => descs.add(x));
		} catch {}
	}
	res.json({
		loss_zone: distinct('loss_zone'),
		reason: distinct('reason'),
		reason_desc: [...descs].sort(),
	});
});
