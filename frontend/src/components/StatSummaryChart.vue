<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { api, type Filters } from '../api';
import { useThemeVars } from 'naive-ui';
const theme = useThemeVars();

const props = defineProps<{ filters: Filters }>();
const s = ref<any>({});

const load = async () => (s.value = await api.summary(props.filters));
onMounted(load);
watch(() => props.filters, load, { deep: true });

const pct = (n = 0, t = 0) => (t ? Math.round((n / t) * 1000) / 10 : 0);

const bars = computed(() => {
	const d = s.value;
	return [
		{ label: 'Вильоти', value: d.flights ?? 0, color: '#5b6ee1' },
		{
			label: 'Успішні',
			value: d.hits ?? 0,
			color: '#3fb950',
			sub: pct(d.hits, d.flights),
		},
		{
			label: 'Неуспішні',
			value: d.misses ?? 0,
			color: '#3fa7d6',
			sub: pct(d.misses, d.flights),
		},
		{
			label: 'День',
			value: d.day ?? 0,
			color: '#e3c000',
			sub: pct(d.day, d.flights),
		},
		{
			label: 'Успішні день',
			value: d.hits_day ?? 0,
			color: '#b7a838',
			sub: pct(d.hits_day, d.day),
		},
		{
			label: 'Неуспішні день',
			value: d.misses_day ?? 0,
			color: '#8a8a4a',
			sub: pct(d.misses_day, d.day),
		},
		{
			label: 'Ніч',
			value: d.night ?? 0,
			color: '#555',
			sub: pct(d.night, d.flights),
		},
		{
			label: 'Успішні ніч',
			value: d.hits_night ?? 0,
			color: '#888',
			sub: pct(d.hits_night, d.night),
		},
		{
			label: 'Неуспішні ніч',
			value: d.misses_night ?? 0,
			color: '#ccc',
			sub: pct(d.misses_night, d.night),
		},
	];
});

const option = computed(() => ({
	tooltip: { trigger: 'axis' },
	grid: { left: 16, right: 16, top: 24, bottom: 60, containLabel: true },
	xAxis: {
		type: 'category',
		data: bars.value.map(b => b.label),
		axisLabel: { interval: 0, rotate: 30 },
	},
	yAxis: { type: 'value' },
	series: [
		{
			type: 'bar',
			data: bars.value.map(b => ({
				value: b.value,
				itemStyle: { color: b.color },
			})),
			label: {
				show: true,
				position: 'top',
				color: theme.value.textColor2,
				textBorderColor: theme.value.bodyColor,
				textBorderWidth: 3,
				fontWeight: 'bold',
				formatter: (p: any) => {
					const b = bars.value[p.dataIndex];
					return b.sub != null ? `${b.value} (${b.sub}%)` : `${b.value}`;
				},
			},
		},
	],
}));
</script>

<template>
	<n-card size="small" class="chart-card">
		<v-chart :option="option" class="chart" autoresize />
	</n-card>
</template>

<style scoped>
.chart-card {
	margin-bottom: 16px;
}
.chart {
	height: 340px;
}
.hint {
	display: block;
	margin-top: 8px;
	text-align: center;
}
</style>
