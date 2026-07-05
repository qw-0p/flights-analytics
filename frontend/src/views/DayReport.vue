<script setup lang="ts">
import { watch, onMounted, h } from 'vue';
import { NSelect, NInput, NInputNumber, NButton, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { useRecordsStore } from '../stores/records';
import { useVideoModal } from '../composables/useVideoModal';
import VideoModal from '../components/VideoModal.vue';
import { useAuth } from '../composables/useAuth';

const { show } = useVideoModal();
const { authed, ready, check } = useAuth();

const store = useRecordsStore();
const { baseDate, rows, opts, loading, window19 } = storeToRefs(store);

onMounted(async () => {
	if (!ready.value) await check();
	if (authed.value) store.load();
});
watch(baseDate, store.load);

const toOpts = (a: string[]) => a.map(v => ({ label: v, value: v }));

const cell =
	(key: 'loss_zone' | 'reason' | 'reason_desc', multiple = false) =>
	(row: any) =>
		h(NSelect, {
			value: row[key],
			multiple,
			filterable: true,
			tag: true,
			size: 'small',
			clearable: true,
			options: toOpts(opts.value[key]),
			'onUpdate:value': (v: any) => {
				row[key] = v;
				store.save(row);
			},
		});

const numCell = (row: any) =>
	h(NInputNumber, {
		value:
			row.break_dist === '' || row.break_dist == null
				? null
				: Number(row.break_dist),
		size: 'small',
		showButton: false,
		clearable: true,
		'onUpdate:value': (v: number | null) => {
			row.break_dist = v == null ? '' : String(v);
			store.save(row);
		},
	});

const videoCell = (r: any) =>
	r.video.length
		? h(
				'div',
				{ class: 'dvr' },
				r.video.map((u: string, i: number) =>
					h(
						NButton,
						{
							text: true,
							size: 'small',
							type: 'primary',
							onClick: () => show(u),
						},
						() => `Відео ${i + 1}`,
					),
				),
			)
		: '';

const resultCell = (r: any) =>
	h(
		NTag,
		{
			size: 'medium',
			type: r.success ? 'success' : 'error',
		},
		() => (r.day_night === 'night' ? 'Ніч' : 'День'),
	);
const noteCell = (row: any) =>
	h(NInput, {
		value: row.note ?? '',
		size: 'small',
		type: 'textarea',
		autosize: { minRows: 1, maxRows: 2 },
		clearable: true,
		'onUpdate:value': (v: string) => {
			row.note = v;
		},
		onBlur: () => store.save(row),
	});

const columns = [
	{
		title: '№',
		key: 'idx',
		width: 50,
		fixed: 'left',
		render: (_: any, i: number) => i + 1,
	},
	{ title: 'Розрахунок', key: 'crew', width: 100, fixed: 'left' },
	{
		title: 'Позиції',
		key: 'position',
		width: 120,
		ellipsis: { tooltip: true },
	},
	{ title: 'No', key: 'number', width: 60 },
	{ title: 'Дата', key: 'date', width: 100 },
	{ title: 'Час', key: 'time', width: 70 },
	{ title: 'Дрон', key: 'craftname', width: 140, ellipsis: { tooltip: true } },
	{ title: 'Ціль', key: 'target', width: 120, ellipsis: { tooltip: true } },
	{
		title: 'Результат',
		key: 'success',
		width: 100,
		align: 'center',
		render: resultCell,
	},
	{
		title: 'Зона втрати',
		key: 'loss_zone',
		width: 180,
		render: cell('loss_zone'),
	},
	{ title: 'Причина', key: 'reason', width: 160, render: cell('reason') },
	{
		title: 'Опис причини',
		key: 'reason_desc',
		width: 220,
		render: cell('reason_desc', true),
	},
	{ title: 'Примітка', key: 'note', width: 240, render: noteCell },
];

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '');
</script>

<template>
	<div class="page">
		<n-space align="center" class="header">
			<h2 class="title">Звіт за добу</h2>
			<n-date-picker v-model:value="baseDate" type="date" />
			<n-text depth="3">
				{{ fmt(window19.from) }} — {{ fmt(window19.to) }}
			</n-text>
		</n-space>
		<n-data-table
			:columns="columns"
			:data="rows"
			:loading="loading"
			size="small"
			:scroll-x="1600"
		/>
		<VideoModal />
	</div>
</template>

<style scoped>
.page {
	padding: 16px;
	margin: 0 auto;
}
.header {
	margin-bottom: 16px;
}
.title {
	margin: 0;
}
.dvr {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}

.result {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}
</style>
