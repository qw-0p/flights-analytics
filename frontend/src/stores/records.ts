import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api'

export type AnnKey = 'loss_zone' | 'reason' | 'reason_desc'
type AnnOpts = Record<AnnKey, string[]>

const dayWindow = (base: number) => {
	const d = new Date(base)
	const end = new Date(
		Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 16, 0, 0),
	)
	const start = new Date(end)
	start.setUTCDate(start.getUTCDate() - 1)
	return { from: start.toISOString(), to: end.toISOString() }
}

export const useRecordsStore = defineStore('records', () => {
	const baseDate = ref<number>(Date.now())
	const rows = ref<any[]>([])
	const opts = ref<AnnOpts>({ loss_zone: [], reason: [], reason_desc: [] })
	const loading = ref(false)

	const window19 = computed(() => dayWindow(baseDate.value))

	async function load() {
		loading.value = true
		const [recs, options] = await Promise.all([
			api.records(window19.value),
			api.getSettings(),
		])
		rows.value = recs.map(norm)
		opts.value = {
			loss_zone: options?.loss_zone ?? [],
			reason: options?.reason ?? [],
			reason_desc: options?.reason_desc ?? [],
		}
		loading.value = false
	}

	function save(row: any) {
		return api.saveAnn(row.uuid, {
			loss_zone: row.loss_zone ?? '',
			reason: row.reason ?? '',
			reason_desc: row.reason_desc ?? [],
			break_dist: row.break_dist ?? '',
			note: row.note ?? '',
		})
	}

	const parseVideo = (v: any): string[] => {
		if (Array.isArray(v)) return v
		try {
			return JSON.parse(v || '[]')
		} catch {
			return []
		}
	}

	const norm = (r: any) => ({
		...r,
		success: Number(r.success),
		crew: (r.crew || '').split(/\s+/)[1] ?? r.crew ?? '',
		date: (r.time || '').split(' ')[0] ?? '',
		time: (r.time || '').split(' ')[1] ?? '',
		video: parseVideo(r.video),
	})

	return { baseDate, rows, opts, loading, window19, load, save }
})
