<script setup lang="ts">
import { ref, computed, watch, onMounted, h, onUnmounted } from 'vue';
import { NDataTable } from 'naive-ui';
import { api, type Filters } from '../api';

const props = defineProps<{ filters: Filters }>();

const zones = ref<string[]>([]);
const reasons = ref<string[]>([]);
const days = ref<any[]>([]);
const loading = ref(false);
const colors = ref<Record<string, string>>({});

async function load() {
	loading.value = true;
	const { from, to, ...rest } = props.filters;
	const data = await api.pivot(rest);
	zones.value = data.zones;
	reasons.value = data.reasons;
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
) => ({
	title,
	key: title,
	children: [
		{
			title: 'к-ть',
			key: `${title}_c`,
			width: 60,
			render: (r: any) => colored(r.day, `${title}_c`, get(r)),
		},
		{
			title: '%',
			key: `${title}_p`,
			width: 60,
			render: (r: any) => `${pct(get(r), base(r))}%`,
		},
	],
});

const summaryRow = computed(() => {
	const sum = (f: (r: any) => number) =>
		days.value.reduce((a, r) => a + f(r), 0);
	const flights = sum(r => r.flights);
	const cell = (v: number) => ({ value: v });
	const s: any = { day: { value: 'Разом' }, flights: cell(flights) };
	const add = (key: string, v: number) => (s[`${key}_c`] = cell(v));
	add(
		'Успішні',
		sum(r => r.hits),
	);
	add(
		'Неуспішні',
		sum(r => r.misses),
	);
	add(
		'День',
		sum(r => r.day_c),
	);
	add(
		'Ніч',
		sum(r => r.night_c),
	);
	zones.value.forEach(z =>
		add(
			z,
			sum(r => r.zone[z] || 0),
		),
	);
	reasons.value.forEach(rn =>
		add(
			rn,
			sum(r => r.reason[rn] || 0),
		),
	);
	return s;
});
onMounted(load);
watch(() => props.filters, load, { deep: true });

const pct = (n = 0, t = 0) => (t ? Math.round((n / t) * 100) : 0);

const columns = computed(() => [
	{ title: 'Доба', key: 'day', width: 120, fixed: 'left' as const },
	{
		title: 'Вильоти',
		key: 'flights',
		width: 90,
		render: (r: any) => r.flights,
	},
	metric(
		'Успішні',
		r => r.hits,
		r => r.flights,
	),
	metric(
		'Неуспішні',
		r => r.misses,
		r => r.flights,
	),
	metric(
		'День',
		r => r.day_c,
		r => r.flights,
	),
	metric(
		'Ніч',
		r => r.night_c,
		r => r.flights,
	),
	...zones.value.map(z =>
		metric(
			z,
			r => r.zone[z] || 0,
			r => r.flights,
		),
	),
	...reasons.value.map(rn =>
		metric(
			rn,
			r => r.reason[rn] || 0,
			r => r.flights,
		),
	),
]);

const scrollX = computed(() => {
	const metricCols = 4 + zones.value.length + reasons.value.length;
	return 210 + metricCols * 120;
});

const maxHeight = ref('calc(100vh - 230px)');
</script>

<template>
	<n-data-table
		:columns="columns"
		:data="days"
		:loading="loading"
		:scroll-x="2150"
		:max-height="maxHeight"
		size="small"
		:bordered="true"
		:single-line="false"
	/>
</template>
