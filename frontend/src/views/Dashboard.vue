<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import VChart from 'vue-echarts';
import { api, type Filters } from '../api';
import { useMessage } from 'naive-ui';

const msg = useMessage();
const authed = ref(true);
const loading = ref(false);
const syncInfo = ref<any>(null);

const filters = reactive<Filters>({});
const opts = reactive<{
	crew: string[];
	dronType: string[];
	result: string[];
	location: string[];
}>({ crew: [], dronType: [], result: [], location: [] });
const dateRange = ref<[number, number] | null>(null);

const summary = ref<any>({});
const ts = ref<any[]>([]);
const byCrew = ref<any[]>([]);
const byResult = ref<any[]>([]);

const toSelOpts = (arr: string[]) => arr.map(v => ({ label: v, value: v }));

async function checkAuth() {
	const s = await api.authStatus();
	authed.value = s.authed;
}
async function login() {
	window.location.href = await api.authUrl();
}
async function sync() {
	loading.value = true;
	syncInfo.value = await api.triggerSync();
	loading.value = false;
	if (syncInfo.value.error) msg.error('Sync: ' + syncInfo.value.error);
	else msg.success(`Синхронізовано: ${syncInfo.value.count}`);
	await loadAll();
}

async function loadFilters() {
	const f = await api.filters();
	Object.assign(opts, f);
}

async function loadAll() {
	if (dateRange.value) {
		filters.from = new Date(dateRange.value[0]).toISOString();
		filters.to = new Date(dateRange.value[1]).toISOString();
	} else {
		filters.from = undefined;
		filters.to = undefined;
	}

	[summary.value, ts.value, byCrew.value, byResult.value] = await Promise.all([
		api.summary(filters),
		api.timeseries(filters),
		api.breakdown('crew', filters),
		api.breakdown('result', filters),
	]);
}

onMounted(async () => {
	await checkAuth();
	if (!authed.value) return;
	await Promise.all([loadFilters(), loadAll()]);
	const st = await api.status();
	syncInfo.value = st.sync;
});

let t: any;
watch(filters, () => {
	clearTimeout(t);
	t = setTimeout(loadAll, 250);
});
watch(dateRange, loadAll);

// --- chart options ---
const tsOption = computed(() => ({
	tooltip: { trigger: 'axis' },
	legend: { data: ['Вильоти', '300', '200'], textStyle: { color: '#ccc' } },
	grid: { left: 40, right: 20, top: 40, bottom: 60 },
	dataZoom: [{ type: 'slider' }],
	xAxis: { type: 'category', data: ts.value.map(r => r.day) },
	yAxis: { type: 'value' },
	series: [
		{
			name: 'Вильоти',
			type: 'line',
			smooth: true,
			data: ts.value.map(r => r.records),
		},
		{ name: '300', type: 'bar', data: ts.value.map(r => r.wounded) },
		{ name: '200', type: 'bar', data: ts.value.map(r => r.died) },
	],
}));

const barOption = (rows: any[], name: string) => ({
	tooltip: { trigger: 'axis' },
	grid: { left: 120, right: 20, top: 20, bottom: 30 },
	xAxis: { type: 'value' },
	yAxis: {
		type: 'category',
		data: rows.map(r => r.label).reverse(),
		axisLabel: { color: '#ccc' },
	},
	series: [{ name, type: 'bar', data: rows.map(r => r.value).reverse() }],
});

const pieOption = (title: string, data: { name: string; value: number }[]) => ({
	tooltip: { trigger: 'item' },
	legend: { bottom: 0, textStyle: { color: '#ccc' } },
	series: [
		{
			name: title,
			type: 'pie',
			radius: ['40%', '70%'],
			data,
			label: { color: '#ccc' },
		},
	],
});

const controlPie = computed(() =>
	pieOption('Керування', [
		{ name: 'Файбер', value: summary.value.fiber ?? 0 },
		{ name: 'Радіо', value: summary.value.radio ?? 0 },
	]),
);
const dayNightPie = computed(() =>
	pieOption('Час доби', [
		{ name: 'День', value: summary.value.day ?? 0 },
		{ name: 'Ніч', value: summary.value.night ?? 0 },
	]),
);
</script>

<template>
	<div style="padding: 16px; max-width: 1400px; margin: 0 auto">
		<n-space justify="space-between" align="center" style="margin-bottom: 16px">
			<n-space align="center">
				<n-text depth="3" v-if="syncInfo?.at">
					останній синк: {{ new Date(syncInfo.at).toLocaleString() }}
				</n-text>
				<n-button size="small" :loading="loading" @click="sync">
					Синхронізувати
				</n-button>
			</n-space>
		</n-space>

		<n-card v-if="!authed">
			<n-space vertical align="center" style="padding: 40px">
				<n-text>Потрібен доступ до Google Sheets</n-text>
				<n-button type="primary" @click="login">Увійти через Google</n-button>
			</n-space>
		</n-card>

		<template v-else>
			<!-- фільтри -->
			<n-card size="small" style="margin-bottom: 16px">
				<n-space wrap>
					<n-date-picker
						v-model:value="dateRange"
						type="daterange"
						clearable
						style="width: 300px"
					/>
					<n-select
						v-model:value="filters.crew"
						:options="toSelOpts(opts.crew)"
						placeholder="Розрахунок"
						clearable
						style="width: 180px"
					/>
					<n-select
						v-model:value="filters.dronType"
						:options="toSelOpts(opts.dronType)"
						placeholder="БпЛА"
						clearable
						style="width: 150px"
					/>
					<n-select
						v-model:value="filters.controlType"
						:options="[
							{ label: 'Файбер', value: 'fiber' },
							{ label: 'Радіо', value: 'radio' },
						]"
						placeholder="Керування"
						clearable
						style="width: 140px"
					/>
					<n-select
						v-model:value="filters.dayNight"
						:options="[
							{ label: 'День', value: 'day' },
							{ label: 'Ніч', value: 'night' },
						]"
						placeholder="Час доби"
						clearable
						style="width: 130px"
					/>
					<n-select
						v-model:value="filters.result"
						:options="toSelOpts(opts.result)"
						placeholder="Результат"
						clearable
						style="width: 160px"
					/>
				</n-space>
			</n-card>

			<!-- KPI -->
			<n-grid
				:cols="6"
				:x-gap="12"
				style="margin-bottom: 16px"
				responsive="screen"
				item-responsive
			>
				<n-gi span="6 s:3 m:1">
					<n-card size="small">
						<n-statistic label="Вильоти" :value="summary.records || 0" />
					</n-card>
				</n-gi>
				<n-gi span="6 s:3 m:1">
					<n-card size="small">
						<n-statistic label="200" :value="summary.died || 0" />
					</n-card>
				</n-gi>
				<n-gi span="6 s:3 m:1">
					<n-card size="small">
						<n-statistic label="300" :value="summary.wounded || 0" />
					</n-card>
				</n-gi>
				<n-gi span="6 s:3 m:1">
					<n-card size="small">
						<n-statistic label="Розрахунків" :value="summary.crews || 0" />
					</n-card>
				</n-gi>
				<n-gi span="6 s:3 m:1">
					<n-card size="small">
						<n-statistic
							label="Відеопідтв."
							:value="summary.video_confirmed || 0"
						/>
					</n-card>
				</n-gi>
				<n-gi span="6 s:3 m:1">
					<n-card size="small">
						<n-statistic
							label="Файбер/Радіо"
							:value="`${summary.fiber || 0}/${summary.radio || 0}`"
						/>
					</n-card>
				</n-gi>
			</n-grid>

			<!-- таймсерія -->
			<n-card title="Динаміка по днях" size="small" style="margin-bottom: 16px">
				<v-chart :option="tsOption" style="height: 320px" autoresize />
			</n-card>

			<n-grid :cols="2" :x-gap="16" responsive="screen" item-responsive>
				<n-gi span="2 m:1">
					<n-card
						title="По розрахунках"
						size="small"
						style="margin-bottom: 16px"
					>
						<v-chart
							:option="barOption(byCrew, 'Вильоти')"
							style="height: 300px"
							autoresize
						/>
					</n-card>
				</n-gi>
				<n-gi span="2 m:1">
					<n-card
						title="По результату"
						size="small"
						style="margin-bottom: 16px"
					>
						<v-chart
							:option="barOption(byResult, 'Вильоти')"
							style="height: 300px"
							autoresize
						/>
					</n-card>
				</n-gi>
				<n-gi span="2 m:1">
					<n-card title="Керування" size="small" style="margin-bottom: 16px">
						<v-chart :option="controlPie" style="height: 260px" autoresize />
					</n-card>
				</n-gi>
				<n-gi span="2 m:1">
					<n-card title="Час доби" size="small" style="margin-bottom: 16px">
						<v-chart :option="dayNightPie" style="height: 260px" autoresize />
					</n-card>
				</n-gi>
			</n-grid>
		</template>
	</div>
</template>
