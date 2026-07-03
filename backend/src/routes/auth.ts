import { Router } from 'express';
import { authUrl, exchangeCode, hasAccess } from '../google/oauth.js';
import { runSync } from '../sync/sync.js';
import { cfg } from '../config.js';

export const authRouter = Router();

authRouter.get('/url', (_req, res) => res.json({ url: authUrl() }));

authRouter.get('/status', (req, res) =>
	res.json({
		authed: hasAccess((req.session as any)?.email),
		email: (req.session as any)?.email ?? null,
	}),
);

authRouter.get('/callback', async (req, res) => {
	const code = req.query.code as string | undefined;
	if (!code) return res.status(400).send('no code');
	try {
		const { email, sheetAccess } = await exchangeCode(code);
		(req.session as any).email = email; // сесія по email
		if (sheetAccess) runSync(); // перший синк, якщо є доступ
		res.redirect(sheetAccess ? cfg.frontendUrl : cfg.frontendUrl + '?denied=1');
	} catch (e: any) {
		res.status(500).send('OAuth error: ' + (e?.message ?? e));
	}
});

authRouter.post('/logout', (req, res) => {
	(req as any).session = null;
	res.json({ ok: true });
});
