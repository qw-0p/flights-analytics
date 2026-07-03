import { google } from 'googleapis';
import { cfg } from '../config.js';
import { saveUser, loadUser, anySyncUser } from '../db.js';

const SCOPES = [
	'https://www.googleapis.com/auth/spreadsheets.readonly',
	'openid',
	'email',
];

export function makeClient() {
	return new google.auth.OAuth2(
		cfg.google.clientId,
		cfg.google.clientSecret,
		cfg.google.redirectUri,
	);
}

export function authUrl() {
	return makeClient().generateAuthUrl({
		access_type: 'offline',
		prompt: 'consent',
		scope: SCOPES,
	});
}

async function emailOf(client: any): Promise<string> {
	const oauth2 = google.oauth2({ version: 'v2', auth: client });
	const { data } = await oauth2.userinfo.get();
	if (!data.email) throw new Error('no email');
	return data.email;
}

async function canReadSheet(client: any): Promise<boolean> {
	try {
		const sheets = google.sheets({ version: 'v4', auth: client });
		await sheets.spreadsheets.get({
			spreadsheetId: cfg.sheet.id,
			fields: 'spreadsheetId',
		});
		return true;
	} catch {
		return false;
	}
}

export async function exchangeCode(code: string) {
	const c = makeClient();
	const { tokens } = await c.getToken(code);
	c.setCredentials(tokens);
	const email = await emailOf(c);
	const sheetAccess = await canReadSheet(c);
	saveUser(email, tokens, sheetAccess);
	return { email, sheetAccess };
}

export function hasAccess(email?: string): boolean {
	if (!email) return false;
	return loadUser(email)?.sheet_access === 1;
}

export function syncClient() {
	const u = anySyncUser();
	if (!u) return null;
	const c = makeClient();
	c.setCredentials(u.tokens);
	return c;
}

export function isSyncReady() {
	return Boolean(anySyncUser());
}
