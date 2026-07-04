import { createHash } from 'crypto';

const HEADER = {
	position: 'Позиції',
	date: 'Дата',
	time: 'Час',
	dronType: 'БпЛА',
	crew: 'Назва розрахунку',
	number: 'No',
	target: 'Ціль',
	coordinates: 'Точка',
	result: 'Результат',
	issue: 'Проблема',
	craftname: 'Крафтнейм',
	video: 'Відео',
} as const;

type Idx = Record<keyof typeof HEADER, number>;

function getIndexes(headers: any[]): Idx {
	const out = {} as Idx;
	for (const [key, name] of Object.entries(HEADER)) {
		(out as any)[key] = headers.indexOf(name);
	}
	return out;
}

const at = (row: any[], i: number) => (i >= 0 && i < row.length ? row[i] : '');
const str = (v: any) => (v == null ? '' : String(v).trim());

const rowKey = (row: any[]) =>
	createHash('sha1').update(JSON.stringify(row)).digest('hex').slice(0, 16);

function parseTs(dt: string): number | null {
	const m = dt.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
	if (!m) return null;
	const [, dd, mm, yyyy, hh, min] = m;
	const n = Date.parse(
		`${yyyy}-${mm}-${dd}T${hh.padStart(2, '0')}:${min}:00+03:00`,
	);
	return Number.isFinite(n) ? n : null;
}

const dayNight = (dron: string) => (/\bNFPV\b/i.test(dron) ? 'night' : 'day');
const success = (r: string) =>
	/неусп/i.test(r) ? 0 : /уражено|успішно/i.test(r) ? 1 : null;
const links = (v: string) =>
	JSON.stringify(
		str(v)
			.split(/[\s,;\n]+/)
			.filter(s => /^https?:\/\//.test(s)),
	);

export interface Rec {
	[k: string]: any;
}

export function parseRows(rows: any[][]): Rec[] {
	if (!rows.length) return [];
	const idx = getIndexes(rows[0]);
	const out: Rec[] = [];
	for (let r = 1; r < rows.length; r++) {
		const row = rows[r];
		const crew = str(at(row, idx.crew));
		if (!crew) continue;
		const date = str(at(row, idx.date));
		const time = str(at(row, idx.time));
		const dron = str(at(row, idx.dronType));
		out.push({
			uuid: rowKey(row),
			number: str(at(row, idx.number)),
			time: [date, time].filter(Boolean).join(' '),
			ts: parseTs([date, time].filter(Boolean).join(' ')),
			crew,
			dron_type: dron,
			craftname: str(at(row, idx.craftname)),
			result: str(at(row, idx.result)),
			video: links(at(row, idx.video)),
			break_dist: '',
			targets: 0,
			day_night: dayNight(dron),
			success: success(str(at(row, idx.result))),
			raw: JSON.stringify(row),
		});
	}
	return out;
}
