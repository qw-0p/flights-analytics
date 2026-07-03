import { createHash } from 'crypto'

const HEADER_MAP = {
	number: 'No',
	crew: 'Назва розрахунку',
	date: 'Дата',
	timeStr: 'Час',
	dronType: 'БпЛА',
	result: 'Ціль',
	resultStatus: 'Результат',
	died: '200',
	wounded: '300',
	video: 'Відео',
	issue: 'Проблема',
	craftname: 'Крафтнейм',
} as const

export type Idx = Record<keyof typeof HEADER_MAP, number>

export function buildIndexes(headers: string[]): Idx {
	const out = {} as Idx
	for (const [key, header] of Object.entries(HEADER_MAP)) {
		;(out as any)[key] = headers.indexOf(header)
	}
	return out
}

const at = (row: any[], i: number) => (i >= 0 && i < row.length ? row[i] : '')
const str = (v: any) => (v === null || v === undefined ? '' : String(v).trim())
const num = (v: any) => {
	const n = parseInt(str(v).replace(/[^\d-]/g, ''), 10)
	return Number.isFinite(n) ? n : 0
}

const rowKey = (row: any[]) =>
	createHash('sha1').update(JSON.stringify(row)).digest('hex').slice(0, 16)

function parseTs(dateStr: string, timeStr: string): number | null {
	if (!dateStr) return null
	const [dd, mm, yyyy] = dateStr.split('.')
	if (!dd || !mm || !yyyy) return null
	const [hh = '00', min = '00'] = (timeStr || '').split(':')
	const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${hh.padStart(2, '0')}:${min.padStart(2, '0')}:00+03:00`
	const n = Date.parse(iso)
	return Number.isFinite(n) ? n : null
}

function dronKind(v: string): 'FPV' | 'NFPV' | null {
	const s = v.toUpperCase()
	if (/\bNFPV\b/.test(s)) return 'NFPV'
	if (/\bFPV\b/.test(s)) return 'FPV'
	return null
}

function normSuccess(status: string): 0 | 1 {
	return status.toLowerCase().startsWith('неусп') ? 0 : 1
}

export interface Rec {
	[k: string]: any
}

export function parseRows(rows: any[][]): Rec[] {
	if (!rows.length) return []
	const idx = buildIndexes(rows[0])
	const out: Rec[] = []
	for (let r = 1; r < rows.length; r++) {
		const row = rows[r]
		const crew = str(at(row, idx.crew))
		const isValidDron = str(at(row, idx.dronType)).includes('оптоволокно')
		if (!crew || !isValidDron) continue
		const dronRaw = str(at(row, idx.dronType))
		const kind = dronKind(dronRaw)
		if (!kind) continue
		const dateStr = str(at(row, idx.date))
		const timeStr = str(at(row, idx.timeStr))
		const ts = parseTs(dateStr, timeStr)
		out.push({
			uuid: rowKey(row),
			number: str(at(row, idx.number)),
			time: [dateStr, timeStr].filter(Boolean).join(' '),
			ts,
			crew,
			dron_type: dronRaw,
			craftname: str(at(row, idx.craftname)),
			result: str(at(row, idx.result)),
			video: str(at(row, idx.video)),
			break_dist: '',
			targets: num(at(row, idx.died)) + num(at(row, idx.wounded)),
			day_night: kind === 'NFPV' ? 'night' : 'day',
			success: normSuccess(str(at(row, idx.resultStatus))),
			raw: JSON.stringify(row),
		})
	}
	return out
}
