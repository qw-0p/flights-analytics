import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../api';
import { dayWindow } from '../lib/dayWindow';

export type AnnKey = 'loss_zone' | 'reason' | 'reason_desc';
type AnnOpts = Record<AnnKey, string[]>;

export const useRecordsStore = defineStore('records', () => {
	const today = dayWindow(Date.now());
	const range = ref<[number, number]>([
		Date.parse(today.from),
		Date.parse(today.to),
	]);
	const rows = ref<any[]>([]);
	const opts = ref<AnnOpts>({ loss_zone: [], reason: [], reason_desc: [] });
	const loading = ref(false);

	const window19 = computed(() => ({
		from: new Date(range.value[0]).toISOString(),
		to: new Date(range.value[1]).toISOString(),
	}));

	async function load() {
		loading.value = true;
		const [recs, options] = await Promise.all([
			api.records(window19.value),
			api.getSettings(),
		]);
		rows.value = recs.map(norm);
		opts.value = {
			loss_zone: options?.loss_zone ?? [],
			reason: options?.reason ?? [],
			reason_desc: options?.reason_desc ?? [],
		};
		loading.value = false;
	}

	function save(row: any) {
		return api.saveAnn(row.uuid, {
			loss_zone: row.loss_zone ?? '',
			reason: row.reason ?? '',
			reason_desc: row.reason_desc ?? [],
			break_dist: row.break_dist ?? '',
			note: row.note ?? '',
		});
	}

	const parseVideo = (v: any): string[] => {
		if (Array.isArray(v)) return v;
		try {
			return JSON.parse(v || '[]');
		} catch {
			return [];
		}
	};

	const norm = (r: any) => ({
		...r,
		success: Number(r.success),
		crew: (r.crew || '').split(/\s+/)[1] ?? r.crew ?? '',
		date: (r.time || '').split(' ')[0] ?? '',
		time: (r.time || '').split(' ')[1] ?? '',
		video: parseVideo(r.video),
	});

	return { range, rows, opts, loading, window19, load, save };
});
