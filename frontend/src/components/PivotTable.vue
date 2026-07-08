<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue';
import { NDataTable } from 'naive-ui';
import { api, type Filters } from '../api';

const props = defineProps<{ filters: Filters }>();

const results = ref<string[]>([]);
const zones = ref<string[]>([]);
const reasons = ref<string[]>([]);
const descs = ref<string[]>([]);
const days = ref<any[]>([]);
const loading = ref(false);
const colors = ref<Record<string, string>>({});

async function load() {
	loading.value = true;
	const data = await api.pivot(props.filters);
	results.value = data.results;
	zones.value = data.zones;
	reasons.value = data.reasons;
	descs.value = data.descs;
	days.value = data.days;
	colors.value = Object.fromEntries(
		(data.colors ?? []).map((c: any) => [`${c.day}|${c.metric}`, c.color]),
	);
	loading.value = false;
}

const PALETTE = ['#2e7d32', '#f9a825', '#ef6c00', '#c62828', ''];

async function cycleColor(day: string, key: string) {
	const k = `${day}|${key}`;
	const cur = colors.value[k] ?? '';
	const next = PALETTE[(PALETTE.indexOf(cur) + 1) % PALETTE.length];
	next ? (colors.value[k] = next) : delete colors.value[k];
	colors.value = { ...colors.value };
	await api.setCellColor(day, key, next);
}

const colored = (day: string, key: string, content: any) =>
	h(
		'div',
		{
			class: 'cell',
			style: colors.value[`${day}|${key}`]
				? { background: colors.value[`${day}|${key}`], cursor: 'pointer' }
				: { cursor: 'pointer' },
			onClick: () => cycleColor(day, key),
		},
		content,
	);

const metric = (
	title: string,
	get: (r: any) => number,
	base: (r: any) => number,
	className?: string,
) => ({
	title,
	key: title,
	className,
	children: [
		{
			title: 'к-ть',
			key: `${title}_c`,
			width: 55,
			className,
			render: (r: any) => colored(r.day, `${title}_c`, get(r)),
		},
		{
			title: '%',
			key: `${title}_p`,
			width: 55,
			className,
			render: (r: any) => `${pct(get(r), base(r))}%`,
		},
	],
});
onMounted(load);
watch(() => props.filters, load, { deep: true });

const pct = (n = 0, t = 0) => (t ? Math.round((n / t) * 100) : 0);

const columns = computed(() => [
	{ title: 'Доба', key: 'day', width: 110, fixed: 'left' as const },
	{
		title: 'Вильоти',
		key: 'flights',
		width: 80,
		className: 'grp-total',
		render: (r: any) => r.flights,
	},
	metric(
		'Успішні',
		r => r.hits,
		r => r.flights,
		'grp-total',
	),
	metric(
		'Неуспішні',
		r => r.misses,
		r => r.flights,
		'grp-total',
	),

	{
		title: 'Вильоти день',
		key: 'day_c',
		width: 80,
		className: 'grp-day',
		render: (r: any) => r.day_c,
	},
	metric(
		'Успішні день',
		r => r.hits_day,
		r => r.day_c,
		'grp-day',
	),
	metric(
		'Неуспішні день',
		r => r.misses_day,
		r => r.day_c,
		'grp-day',
	),

	{
		title: 'Вильоти ніч',
		key: 'night_c',
		width: 80,
		className: 'grp-night',
		render: (r: any) => r.night_c,
	},
	metric(
		'Успішні ніч',
		r => r.hits_night,
		r => r.night_c,
		'grp-night',
	),
	metric(
		'Неуспішні ніч',
		r => r.misses_night,
		r => r.night_c,
		'grp-night',
	),

	...results.value
		.filter(v => v !== 'Неуспішно')
		.map(v =>
			metric(
				v,
				r => r.result[v] || 0,
				r => r.flights,
				'grp-result',
			),
		),
	...zones.value.map(v =>
		metric(
			v,
			r => r.zone[v] || 0,
			r => r.flights,
			'grp-zone',
		),
	),
	...reasons.value.map(v =>
		metric(
			v,
			r => r.reason[v] || 0,
			r => r.flights,
			'grp-reason',
		),
	),
	...descs.value.map(v =>
		metric(
			v,
			r => r.desc[v] || 0,
			r => r.flights,
			'grp-desc',
		),
	),
]);

const scrollX = computed(() => {
	const metricCols =
		6 +
		results.value.length +
		zones.value.length +
		reasons.value.length +
		descs.value.length;
	return 110 + 80 * 3 + metricCols * 110;
});

const maxHeight = ref('calc(100vh - 300px)');
</script>

<template>
	<n-data-table
		class="pivot-table"
		:columns="columns"
		:data="days"
		:loading="loading"
		:scroll-x="scrollX"
		:max-height="maxHeight"
		size="small"
		:bordered="true"
		:single-line="false"
		:flex-height="true"
	/>
</template>

<style scoped>
.pivot-table {
	height: 100%;
}
:deep(.grp-total) {
	background: rgba(80, 200, 120, 0.08);
}
:deep(.grp-day) {
	background: rgba(227, 192, 0, 0.08);
}
:deep(.grp-night) {
	background: rgba(120, 120, 120, 0.12);
}
:deep(.grp-result) {
	background: rgba(239, 108, 0, 0.08);
}
:deep(.grp-zone) {
	background: rgba(63, 167, 214, 0.08);
}
:deep(.grp-reason) {
	background: rgba(198, 40, 40, 0.08);
}
:deep(.grp-desc) {
	background: rgba(120, 120, 120, 0.06);
}
</style>
