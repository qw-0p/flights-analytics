<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from 'vue'
import { NSelect, NInput, NInputNumber } from 'naive-ui'
import { api, type Filters } from '../api'

const baseDate = ref<number>(Date.now())
const window19 = computed<Filters>(() => {
	const end = new Date(baseDate.value)
	end.setHours(19, 0, 0, 0)
	const start = new Date(end)
	start.setDate(start.getDate() - 1)
	return { from: start.toISOString(), to: end.toISOString() }
})

const rows = ref<any[]>([])
const opts = ref<Record<'loss_zone' | 'reason' | 'reason_desc', string[]>>({
	loss_zone: [],
	reason: [],
	reason_desc: [],
})
const loading = ref(false)

const toOpts = (a: string[]) => a.map(v => ({ label: v, value: v }))

async function load() {
	loading.value = true
	;[rows.value, opts.value] = await Promise.all([
		api.records(window19.value),
		api.annOptions(),
	])
	loading.value = false
}
onMounted(load)
watch(baseDate, load)

const save = (row: any) =>
	api.saveAnn(row.uuid, {
		loss_zone: row.loss_zone ?? '',
		reason: row.reason ?? '',
		reason_desc: row.reason_desc ?? [],
		break_dist: row.break_dist ?? '',
		note: row.note ?? '',
	})

const crewSecond = (v: string) => (v || '').split(/\s+/)[1] ?? v ?? ''

// фабрика редагованої комірки-селекта (DRY для J/K/L)
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
				row[key] = v
				save(row)
			},
		})

const splitDate = (t?: string) => (t || '').split(' ')[0] ?? ''
const splitTime = (t?: string) => (t || '').split(' ')[1] ?? ''

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
			row.break_dist = v == null ? '' : String(v)
			save(row)
		},
	})

const noteCell = (row: any) =>
	h(NInput, {
		value: row.note ?? '',
		size: 'small',
		type: 'text',
		clearable: true,
		'onUpdate:value': (v: string) => {
			row.note = v
		},
		onBlur: () => save(row),
	})

const columns = computed(() => [
	{
		title: '№',
		key: 'idx',
		width: 50,
		render: (_: any, i: number) => i + 1,
	},
	{
		title: 'Розрахунок',
		key: 'crew',
		width: 130,
		render: (r: any) => crewSecond(r.crew),
	},
	{ title: 'No', key: 'number', width: 60 },
	{
		title: 'Дата',
		key: 'date',
		width: 100,
		render: (r: any) => splitDate(r.time),
	},
	{
		title: 'Час',
		key: 'time',
		width: 70,
		render: (r: any) => splitTime(r.time),
	},
	{ title: 'Дрон', key: 'craftname', ellipsis: true },
	{ title: 'Ціль', key: 'result', ellipsis: true },
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
		width: 240,
		render: cell('reason_desc', true),
	},
	{ title: 'Обрив', key: 'break_dist', width: 110, render: numCell },
	{ title: 'DVR', key: 'video', ellipsis: true },
	{ title: 'Примітка', key: 'note', width: 240, render: noteCell },
])

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '')
</script>

<template>
	<div class="page">
		<n-space align="center" style="margin-bottom: 16px">
			<h2 style="margin: 0">Звіт за добу</h2>
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
			:scroll-x="1200"
		/>
	</div>
</template>

<style scoped>
.page {
	padding: 16px;
	max-width: 1600px;
	margin: 0 auto;
}
</style>
