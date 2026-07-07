<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { api, type Filters } from '../api';
import { useMessage } from 'naive-ui';
import BreakdownChart from '../components/BreakdownChart.vue';
import { dayWindow } from '../lib/dayWindow';
import SummaryKpi from '../components/SummaryKpi.vue';
import PivotTable from '../components/PivotTable.vue';
import DescChart from '../components/DescChart.vue';
import StatSummaryChart from '../components/StatSummaryChart.vue';
import { RESULTS } from '../lib/constants';

const view = ref<'charts' | 'table'>('charts');

const msg = useMessage();
const loading = ref(false);
const syncInfo = ref<any>(null);

const filters = reactive<Filters>({});
const opts = reactive<{ crew: string[]; dronType: string[]; result: string[] }>(
	{
		crew: [],
		dronType: [],
		result: [],
	},
);
const today = dayWindow(Date.now());
const dateRange = ref<[number, number] | null>([
	Date.parse(today.from),
	Date.parse(today.to),
]);
applyRange();

const toSelOpts = (arr: string[]) => arr.map(v => ({ label: v, value: v }));

const DIMS = [
	{ label: 'Успіх', value: 'success' },
	{ label: 'Зона втрати', value: 'loss_zone' },
	{ label: 'Причина', value: 'reason' },
	{ label: 'Розрахунок', value: 'crew' },
	{ label: 'Дрон', value: 'craftname' },
	{ label: 'Час доби', value: 'day_night' },
];

async function sync() {
	loading.value = true;
	syncInfo.value = await api.triggerSync();
	loading.value = false;
	syncInfo.value.error
		? msg.error('Sync: ' + syncInfo.value.error)
		: msg.success(`Синхронізовано: ${syncInfo.value.count}`);
}

async function loadFilters() {
	Object.assign(opts, await api.filters());
}

function applyRange() {
	filters.from = dateRange.value
		? new Date(dateRange.value[0]).toISOString()
		: undefined;
	filters.to = dateRange.value
		? new Date(dateRange.value[1]).toISOString()
		: undefined;
}
watch(dateRange, applyRange);

onMounted(async () => {
	await loadFilters();
	const st = await api.status();
	syncInfo.value = st.sync;
});
</script>

<template>
	<div class="dash">
		<n-space justify="space-between" align="center" class="topbar">
			<n-text depth="3" v-if="syncInfo?.at">
				останній синк: {{ new Date(syncInfo.at).toLocaleString() }}
			</n-text>
			<n-button size="small" :loading="loading" @click="sync">
				Синхронізувати
			</n-button>
		</n-space>

		<n-card size="small" class="filters">
			<n-space wrap>
				<n-date-picker
					v-model:value="dateRange"
					type="daterange"
					clearable
					class="f-range"
				/>
				<n-select
					v-model:value="filters.crew"
					:options="toSelOpts(opts.crew)"
					placeholder="Розрахунок"
					clearable
					class="f-sel"
				/>
				<n-select
					v-model:value="filters.dronType"
					:options="toSelOpts(opts.dronType)"
					placeholder="БпЛА"
					clearable
					class="f-sel"
				/>
				<n-select
					v-model:value="filters.dayNight"
					:options="[
						{ label: 'День', value: 'day' },
						{ label: 'Ніч', value: 'night' },
					]"
					placeholder="Час доби"
					clearable
					class="f-sel"
				/>
			</n-space>
		</n-card>

		<n-radio-group v-model:value="view" size="small" class="view-switch">
			<n-radio-button value="charts">Чарти</n-radio-button>
			<n-radio-button value="table">Таблиця</n-radio-button>
		</n-radio-group>

		<template v-if="view === 'charts'">
			<SummaryKpi :filters="filters" />
			<StatSummaryChart :filters="filters" />

			<n-grid :cols="2" :x-gap="16" responsive="screen" item-responsive>
				<n-gi span="2 m:1">
					<BreakdownChart
						title="Зона втрати"
						:filters="filters"
						:dims="DIMS"
						default-dim="loss_zone"
						:exclude="[...RESULTS, 'Засідка успішно', 'Розвідка успішно']"
					/>
				</n-gi>
				<n-gi span="2 m:1">
					<BreakdownChart
						title="Причина"
						:filters="filters"
						:dims="DIMS"
						default-dim="reason"
						:exclude="['ОК']"
					/>
				</n-gi>
				<n-gi span="2 m:1">
					<BreakdownChart
						title="Розрахунок"
						:filters="filters"
						:dims="DIMS"
						default-dim="crew"
					/>
				</n-gi>
				<n-gi span="2 m:1">
					<BreakdownChart
						title="Успіх"
						:filters="filters"
						:dims="DIMS"
						default-dim="result"
						:exclude="['Неуспішно']"
					/>
				</n-gi>
				<n-gi span="2 m:1">
					<BreakdownChart
						title="Дрони — день"
						:filters="{ ...filters, dayNight: 'day' }"
						:dims="DIMS"
						default-dim="craftname"
					/>
				</n-gi>
				<n-gi span="2 m:1">
					<BreakdownChart
						title="Дрони — ніч"
						:filters="{ ...filters, dayNight: 'night' }"
						:dims="DIMS"
						default-dim="craftname"
					/>
				</n-gi>
			</n-grid>
			<DescChart :filters="filters" :exclude="['ОК']" />
		</template>

		<PivotTable v-else :filters="filters" />
	</div>
</template>

<style scoped>
.dash {
	padding: 0 16px;

	margin: 0 auto;
}
.topbar {
	margin-bottom: 16px;
}
.filters {
	margin-bottom: 16px;
}
.f-range {
	width: 300px;
}
.f-sel {
	width: 160px;
}
.view-switch {
	margin-bottom: 16px;
}
</style>
