import { google } from 'googleapis';
import { cfg } from '../config.js';
import { syncClient } from './oauth.js';

export async function fetchRows(): Promise<any[][]> {
	const auth = syncClient();
	if (!auth) throw new Error('NO_SYNC_USER');
	const sheets = google.sheets({ version: 'v4', auth });
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: cfg.sheet.id,
		range: cfg.sheet.range,
		valueRenderOption: 'UNFORMATTED_VALUE',
		dateTimeRenderOption: 'FORMATTED_STRING',
	});
	return (res.data.values ?? []) as any[][];
}
