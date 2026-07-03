import { createHash } from 'crypto';

const HEADER_MAP = {
	number: 'Номер вильоту',
	crew: 'Назва розрахунку',
	time: 'Час вильоту TV',
	dayHit: 'День "+"',
	dayMiss: 'День "-"',
	nightHit: 'Ніч "+"',
	nightMiss: 'Ніч "-"',
	lossZone: 'Зона втрати борта/вид ураження',
	reason: 'Причина',
	reasonDesc: 'Опис причини',
	breakDist: 'Дистані обриву',
	video: 'DVR',
	dronType: 'Дрон',
} as const;

export type Idx = Record<keyof typeof HEADER_MAP, number>;

export function buildIndexes(headers: any[]): Idx {
	const norm = headers.map(h => (typeof h === 'string' ? h.trim() : h));
	const out = {} as Idx;
	for (const [key, header] of Object.entries(HEADER_MAP)) {
		(out as any)[key] = norm.indexOf(header);
	}
	return out;
}

const at = (row: any[], i: number) => (i >= 0 && i < row.length ? row[i] : '');
const str = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
const num = (v: any) => {
	const n = parseInt(str(v).replace(/[^\d-]/g, ''), 10);
	return Number.isFinite(n) ? n : 0;
};

const rowKey = (row: any[]) =>
	createHash('sha1').update(JSON.stringify(row)).digest('hex').slice(0, 16);

function deriveFlight(row: any[], idx: Idx) {
	const c = (i: number) => num(at(row, i));
	const dH = c(idx.dayHit),
		dM = c(idx.dayMiss),
		nH = c(idx.nightHit),
		nM = c(idx.nightMiss);
	return {
		targets: dH + dM + nH + nM,
		day_night: dH || dM ? 'day' : nH || nM ? 'night' : '',
		success: dH || nH ? 1 : dM || nM ? 0 : null,
	};
}

export interface Rec {
	[k: string]: any;
}

export function parseRows(rows: any[][]): Rec[] {
	if (!rows.length) return [];
	const idx = buildIndexes(rows[0]);
	const out: Rec[] = [];
	for (let r = 1; r < rows.length; r++) {
		const row = rows[r];
		const crew = str(at(row, idx.crew));
		if (!crew) continue;
		const f = deriveFlight(row, idx);
		out.push({
			uuid: rowKey(row),
			number: str(at(row, idx.number)),
			time: str(at(row, idx.time)),
			crew,
			dron_type: str(at(row, idx.dronType)),
			result: str(at(row, idx.lossZone)),
			video: str(at(row, idx.video)),
			break_dist: str(at(row, idx.breakDist)),
			targets: f.targets,
			day_night: f.day_night,
			success: f.success,
			raw: JSON.stringify(row),
		});
	}
	return out;
}
