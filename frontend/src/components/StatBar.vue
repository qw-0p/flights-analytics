<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { api, type Filters } from '../api'

const props = defineProps<{
	filters: Filters
	dims: { label: string; value: string }[]
	defaultDim: string
}>()

const dim = ref(props.defaultDim)
const rows = ref<{ label: string; count: number; pct: number }[]>([])
const total = ref(0)

async function load() {
	const data = await api.breakdown(dim.value, props.filters)
	rows.value = data.rows
	total.value = data.total
}
onMounted(load)
watch(() => [dim.value, props.filters], load, { deep: true })

const option = computed(() => ({
	tooltip: {
		trigger: 'axis',
		axisPointer: { type: 'shadow' },
		formatter: (p: any) =>
			p
				.filter((x: any) => x.value)
				.map((x: any) => `${x.seriesName}: ${x.value}`)
				.join('<br/>'),
	},
	legend: { bottom: 0, type: 'scroll' },
	grid: { left: 16, right: 16, top: 16, bottom: 48, containLabel: true },
	xAxis: { type: 'value', max: total.value },
	yAxis: { type: 'category', data: ['Вильоти'] },
	series: rows.value.map(r => ({
		name: `${r.label} (${r.pct}%)`,
		type: 'bar',
		stack: 'total',
		emphasis: { focus: 'series' },
		label: {
			show: r.pct >= 4,
			formatter: `${r.count}`,
		},
		data: [r.count],
	})),
}))
</script>

<template>
	<n-card size="small" class="statbar">
		<template #header-extra>
			<n-select v-model:value="dim" :options="dims" size="small" class="dim" />
		</template>
		<v-chart :option="option" class="chart" autoresize />
	</n-card>
</template>

<style scoped>
.statbar {
	margin-bottom: 16px;
}
.dim {
	width: 160px;
}
.chart {
	height: 160px;
}
</style>
