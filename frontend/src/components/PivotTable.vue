<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue';
import { NDataTable } from 'naive-ui';
import { api, type Filters } from '../api';

const props = defineProps<{ filters: Filters }>();

const zones = ref<string[]>([]);
const reasons = ref<string[]>([]);
const days = ref<any[]>([]);
const loading = ref(false);

async function load() {
	loading.value = true;
	const { from, to, ...rest } = props.filters;
	const data = await api.pivot(rest);
	zones.value = data.zones;
	reasons.value = data.reasons;
	days.value = data.days;
	loading.value = false;
}
onMounted(load);
watch(() => props.filters, load, { deep: true });

const pct = (n = 0, t = 0) => (t ? Math.round((n / t) * 100) : 0);

// пара колонок к-ть + % для метрики
const metric = (
	title: string,
	get: (r: any) => number,
	base: (r: any) => number,
) => ({
	title,
	key: title,
	children: [
		{ title: 'к-ть', key: `${title}_c`, width: 60, render: (r: any) => get(r) },
		{
			title: '%',
			key: `${title}_p`,
			width: 60,
			render: (r: any) => `${pct(get(r), base(r))}%`,
		},
	],
});

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
</script>

<template>
	<n-data-table
		:columns="columns"
		:data="days"
		:loading="loading"
		size="small"
		:scroll-x="1800"
		:bordered="true"
		:single-line="false"
	/>
</template>

<style scoped></style>
