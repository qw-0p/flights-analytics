<script setup lang="ts">
import { ref, computed } from 'vue';

// Звітна доба: 19:00 попереднього дня -> 19:00 поточного.
// baseDate — «кінцева» дата доби (та, на 19:00 якої звіт закривається).
const baseDate = ref<number>(Date.now());

const window19 = computed(() => {
	const end = new Date(baseDate.value);
	end.setHours(19, 0, 0, 0);
	const start = new Date(end);
	start.setDate(start.getDate() - 1);
	return { from: start.toISOString(), to: end.toISOString() };
});

const fmt = (iso: string) => new Date(iso).toLocaleString();
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

		<!-- TODO: таблиця аналізу за window19 (тягнемо з /api/... з from/to) -->
		<n-empty description="Тут буде табличка аналізу за добу" />
	</div>
</template>

<style scoped>
.page {
	padding: 56px 16px 16px;
	max-width: 1400px;
	margin: 0 auto;
}
</style>
