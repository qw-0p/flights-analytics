import { Router } from 'express';
import { getSetting, setSetting } from '../db.js';

export const settingsRouter = Router();

const KEYS = ['loss_zone', 'reason', 'reason_desc'] as const;

settingsRouter.get('/', (_req, res) => {
	res.json(Object.fromEntries(KEYS.map(k => [k, getSetting(k)])));
});

settingsRouter.put('/:key', (req, res) => {
	const key = req.params.key;
	if (!KEYS.includes(key as any))
		return res.status(400).json({ error: 'bad key' });
	const items: string[] = Array.isArray(req.body?.items)
		? req.body.items.map(String)
		: [];
	setSetting(key, [...new Set(items)]);
	res.json({ ok: true, items });
});
