import express from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import { cfg } from './config.js';
import './db.js';
import { authRouter } from './routes/auth.js';
import { apiRouter } from './routes/analytics.js';
import { annRouter } from './routes/annotations.js';
import { requireAccess } from './middleware/auth.js';
import { startSyncSchedule } from './sync/sync.js';
import { settingsRouter } from './routes/settings.js';

const app = express();
app.use(cors({ origin: cfg.frontendUrl, credentials: true }));
app.use(express.json());
app.use(
	cookieSession({
		name: 'sess',
		secret: cfg.cookieSecret,
		maxAge: 30 * 24 * 3600 * 1000,
		sameSite: 'lax',
		httpOnly: true,
	}),
);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/api', requireAccess, apiRouter);
app.use('/api/annotation', requireAccess, annRouter);
app.use('/api/settings', requireAccess, settingsRouter);

app.listen(cfg.port, () => {
	console.log(`[backend] http://localhost:${cfg.port}`);
	startSyncSchedule();
});
