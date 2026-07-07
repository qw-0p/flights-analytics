<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { api, type Filters } from '../api';
import { useThemeVars } from 'naive-ui';

const theme = useThemeVars();
const props = defineProps<{
	title: string;
	filters: Filters;
	defaultDim: string;
	descMode?: boolean;
	exclude?: string[];
}>();

type ChartType = 'bar' | 'pie';
const dim = ref(props.defaultDim);
const type = ref<ChartType>('pie');
const rows = ref<{ label: string; count: number; pct: number }[]>([]);
const total = ref(0);

async function load() {
	const data = props.descMode
		? await api.breakdownDesc(props.filters)
		: await api.breakdown(dim.value, props.filters, props.exclude ?? []);
	rows.value = data.rows;
	total.value = data.total;
}
onMounted(load);
watch(() => [dim.value, props.filters], load, { deep: true });

const typeOpts = [
	{ label: 'Стовпці', value: 'bar' },
	{ label: 'Кругова', value: 'pie' },
];

const option = computed(() =>
	type.value === 'pie'
		? {
				tooltip: {
					trigger: 'item',
					formatter: '{b}: {c} ({d}%)',
				},
				legend: { bottom: 0, textStyle: { color: theme.value.textColor2 } },
				label: { color: theme.value.textColor2, textBorderWidth: 0 },
				series: [
					{
						type: 'pie',
						radius: ['40%', '70%'],
						data: rows.value.map(r => ({
							name: r.label,
							value: r.count,
						})),
					},
				],
			}
		: {
				tooltip: {
					trigger: 'axis',
					formatter: (p: any) => {
						const d = p[0];
						const row = rows.value[d.dataIndex];
						return `${d.name}: ${row.count} (${row.pct}%)`;
					},
				},
				grid: { left: 140, right: 24, top: 16, bottom: 24 },
				xAxis: { type: 'value' },
				yAxis: {
					type: 'category',
					data: rows.value.map(r => r.label).reverse(),
				},
				series: [
					{
						type: 'bar',
						data: rows.value.map(r => r.count).reverse(),
					},
				],
			},
);
</script>

<template>
	<n-card :title="title" size="small" class="chart-card">
		<template #header-extra>
			<n-space size="small">
				<n-select
					v-model:value="type"
					:options="typeOpts"
					size="small"
					class="ctrl"
				/>
			</n-space>
		</template>
		<v-chart :option="option" class="chart" autoresize />
		<n-text depth="3" class="total">Всього: {{ total }}</n-text>
	</n-card>
</template>

<style scoped>
.chart-card {
	margin-bottom: 16px;
}
.ctrl {
	width: 150px;
}
.chart {
	height: 320px;
}
.total {
	display: block;
	margin-top: 8px;
}
</style>
