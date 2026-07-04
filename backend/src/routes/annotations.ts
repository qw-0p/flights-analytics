import { Router } from 'express'
import { db } from '../db.js'

export const annRouter = Router()

// upsert ручних полів по запису
annRouter.put('/:uuid', (req, res) => {
	const {
		loss_zone = '',
		reason = '',
		reason_desc = [],
		break_dist = '',
		note = '',
		targets = 0,
	} = req.body ?? {}
	db.prepare(
		`
    INSERT INTO annotations (uuid, loss_zone, reason, reason_desc, break_dist, note, targets, updated_at)
    VALUES (@uuid,@loss_zone,@reason,@reason_desc,@break_dist,@note,@targets,@updated_at)
    ON CONFLICT(uuid) DO UPDATE SET
      loss_zone=excluded.loss_zone, reason=excluded.reason,
      reason_desc=excluded.reason_desc, break_dist=excluded.break_dist,
      note=excluded.note, targets=excluded.targets, updated_at=excluded.updated_at
  `,
	).run({
		uuid: req.params.uuid,
		loss_zone,
		reason,
		reason_desc: JSON.stringify(reason_desc),
		break_dist: String(break_dist ?? ''),
		note: String(note ?? ''),
		targets: Number(targets) || 0,
		updated_at: new Date().toISOString(),
	})
	res.json({ ok: true })
})

// значення для селектів (раніше введені)
annRouter.get('/options', (_req, res) => {
	const distinct = (col: string) =>
		(
			db
				.prepare(
					`SELECT DISTINCT ${col} v FROM annotations WHERE ${col}<>'' ORDER BY ${col}`,
				)
				.all() as any[]
		).map(r => r.v)
	const descs = new Set<string>()
	for (const r of db
		.prepare(
			`SELECT reason_desc AS d FROM annotations WHERE reason_desc<>'' AND reason_desc<>'[]'`,
		)
		.all() as any[]) {
		try {
			JSON.parse(r.d).forEach((x: string) => descs.add(x))
		} catch {}
	}
	res.json({
		loss_zone: distinct('loss_zone'),
		reason: distinct('reason'),
		reason_desc: [...descs].sort(),
	})
})
