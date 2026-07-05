<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { api, type Filters } from '../api'

const props = defineProps<{ filters: Filters }>()
const s = ref<any>({})

const load = async () => (s.value = await api.summary(props.filters))
onMounted(load)
watch(() => props.filters, load, { deep: true })

const pct = (n = 0, total = 0) =>
	total ? Math.round((n / total) * 1000) / 10 : 0

const cards = () => [
	{ label: 'Вильоти', value: s.value.flights ?? 0 },
	{
		label: 'Успішні',
		value: `${s.value.hits ?? 0} (${pct(s.value.hits, s.value.flights)}%)`,
	},
	{
		label: 'Неуспішні',
		value: `${s.value.misses ?? 0} (${pct(s.value.misses, s.value.flights)}%)`,
	},
	{
		label: 'Успішні день',
		value: `${s.value.hits_day ?? 0} (${pct(s.value.hits_day, s.value.day)}%)`,
	},
	{
		label: 'Неуспішні день',
		value: `${s.value.misses_day ?? 0} (${pct(s.value.misses_day, s.value.day)}%)`,
	},
	{
		label: 'Успішні ніч',
		value: `${s.value.hits_night ?? 0} (${pct(s.value.hits_night, s.value.night)}%)`,
	},
	{
		label: 'Неуспішні ніч',
		value: `${s.value.misses_night ?? 0} (${pct(s.value.misses_night, s.value.night)}%)`,
	},
	{ label: 'Розрахунків', value: s.value.crews ?? 0 },
]
</script>

<template>
	<n-grid :cols="8" :x-gap="12" responsive="screen" item-responsive class="kpi">
		<n-gi v-for="c in cards()" :key="c.label" span="8 s:4 m:2 l:1">
			<n-card size="small">
				<n-statistic :label="c.label" :value="c.value" />
			</n-card>
		</n-gi>
	</n-grid>
</template>

<style scoped>
.kpi {
	margin-bottom: 16px;
}
</style>
