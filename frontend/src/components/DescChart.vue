<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { useThemeVars } from 'naive-ui';
import { api, type Filters } from '../api';

const props = defineProps<{ filters: Filters; exclude?: string[] }>();
const theme = useThemeVars();

const rows = ref<{ label: string; count: number; pct: number }[]>([]);
const total = ref(0);
const type = ref<'bar' | 'pie'>('bar');

async function load() {
	const data = await api.breakdownDesc(props.filters, props.exclude ?? []);
	rows.value = data.rows;
	total.value = data.total;
}
onMounted(load);
watch(() => [props.filters, props.exclude], load, { deep: true });

const typeOpts = [
	{ label: 'Стовпці', value: 'bar' },
	{ label: 'Кругова', value: 'pie' },
];

const option = computed(() =>
	type.value === 'pie'
		? {
				tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
				legend: {
					bottom: 0,
					type: 'scroll',
					textStyle: { color: theme.value.textColor2 },
				},
				series: [
					{
						type: 'pie',
						radius: ['35%', '65%'],
						data: rows.value.map(r => ({ name: r.label, value: r.count })),
					},
				],
			}
		: {
				tooltip: {
					trigger: 'axis',
					formatter: (p: any) => {
						const r = rows.value[p[0].dataIndex];
						return `${r.label}: ${r.count} (${r.pct}%)`;
					},
				},
				grid: { left: 16, right: 16, top: 24, bottom: 120, containLabel: true },
				xAxis: {
					type: 'category',
					data: rows.value.map(r => r.label),
					axisLabel: { interval: 0, rotate: 60, color: theme.value.textColor2 },
				},
				yAxis: { type: 'value' },
				series: [
					{
						type: 'bar',
						data: rows.value.map(r => r.count),
						label: {
							show: true,
							position: 'top',
							color: theme.value.textColor2,
							formatter: (p: any) =>
								`${p.value} (${rows.value[p.dataIndex].pct}%)`,
						},
					},
				],
			},
);
</script>

<template>
	<n-card size="small" class="desc-card">
		<template #header>
			<n-space justify="space-between" align="center">
				<span>Опис причин · {{ total }}</span>
				<n-select
					v-model:value="type"
					:options="typeOpts"
					size="small"
					class="ctrl"
				/>
			</n-space>
		</template>
		<v-chart :option="option" class="chart" autoresize />
	</n-card>
</template>

<style scoped>
.desc-card {
	margin-bottom: 16px;
}
.ctrl {
	width: 130px;
}
.chart {
	height: 420px;
}
</style>
